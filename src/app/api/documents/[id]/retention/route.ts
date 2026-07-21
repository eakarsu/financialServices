import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { deleteFile } from '@/lib/storage'
import { retentionDecision } from '@/lib/retention'
import { requestContext } from '@/lib/request-context'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'PARTNER'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const document = await getDocumentForAccess(id, user, 'MANAGE')
    const input = await request.json()
    if (input.action !== 'evaluate' && input.action !== 'dispose') {
      return NextResponse.json({ error: 'action must be evaluate or dispose' }, { status: 400 })
    }
    const activeHoldCount = document.legalHoldLinks.filter((link) => link.legalHold.status === 'ACTIVE').length
    const decision = retentionDecision({
      current: document.retentionDisposition,
      retainUntil: document.retainUntil,
      activeHoldCount,
    })
    const context = requestContext(request)

    if (input.action === 'evaluate') {
      await prisma.$transaction(async (tx) => {
        await tx.document.update({ where: { id }, data: { retentionDisposition: decision } })
        await appendAuditEventTx(tx, {
          firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
          action: 'RETENTION_EVENT', entityType: 'Document', entityId: id,
          oldValue: { disposition: document.retentionDisposition }, newValue: { disposition: decision, activeHoldCount },
          ipAddress: context.ipAddress, userAgent: context.userAgent,
        })
      })
      return NextResponse.json({ disposition: decision })
    }

    if (decision !== 'ELIGIBLE') {
      return NextResponse.json({ error: `Document is not eligible for disposition (${decision})` }, { status: 409 })
    }
    if (input.confirmContentSha256 !== document.contentSha256) {
      return NextResponse.json({ error: 'Current content SHA-256 confirmation does not match' }, { status: 409 })
    }
    const versions = await prisma.documentVersion.findMany({ where: { documentId: id }, select: { storageKey: true } })
    for (const storageKey of Array.from(new Set(versions.map((version) => version.storageKey)))) {
      await deleteFile(storageKey)
    }
    await prisma.$transaction(async (tx) => {
      await tx.document.update({ where: { id }, data: { retentionDisposition: 'DISPOSED', status: 'ARCHIVED' } })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'RETENTION_EVENT', entityType: 'Document', entityId: id,
        oldValue: { disposition: decision },
        newValue: { disposition: 'DISPOSED', deletedObjects: versions.length, contentSha256: document.contentSha256 },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
    })
    return NextResponse.json({ disposition: 'DISPOSED' })
  } catch (error) {
    if (error instanceof DocumentAccessError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Retention operation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Retention operation failed' }, { status: 500 })
  }
}
