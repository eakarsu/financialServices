import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx, diffShallow } from '@/lib/audit'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { requestContext } from '@/lib/request-context'

function accessError(error: unknown) {
  if (error instanceof DocumentAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error('Document operation error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await getDocumentForAccess(id, user, 'VIEW')
    const document = await prisma.document.findUniqueOrThrow({
      where: { id },
      include: {
        client: true,
        uploadedBy: { select: { firstName: true, lastName: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
        versions: { orderBy: { version: 'desc' }, include: { processingEvents: true } },
        signatures: { select: { id: true, signerName: true, signerEmail: true, status: true, provider: true, expiresAt: true, failureCode: true, failureReason: true, signedAt: true } },
        folder: true,
        legalHoldLinks: { include: { legalHold: true } },
        redactions: true,
      },
    })
    return NextResponse.json(document)
  } catch (error) {
    return accessError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const existing = await getDocumentForAccess(id, user, 'EDIT')
    const input = await request.json()
    const allowed = {
      name: typeof input.name === 'string' ? input.name.trim().slice(0, 255) : existing.name,
      description: typeof input.description === 'string' ? input.description.slice(0, 4000) : existing.description,
      category: typeof input.category === 'string' ? input.category.slice(0, 100) : existing.category,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : existing.expiresAt,
      retainUntil: input.retainUntil ? new Date(input.retainUntil) : existing.retainUntil,
    }
    if (!allowed.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const context = requestContext(request)
    const document = await prisma.$transaction(async (tx) => {
      const updated = await tx.document.update({ where: { id }, data: allowed })
      const changes = diffShallow(existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>)
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'UPDATE', entityType: 'Document', entityId: id,
        oldValue: changes.before, newValue: changes.after,
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return updated
    })
    return NextResponse.json(document)
  } catch (error) {
    return accessError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const existing = await getDocumentForAccess(id, user, 'MANAGE')
    if (existing.legalHoldLinks.some((link) => link.legalHold.status === 'ACTIVE')) {
      return NextResponse.json({ error: 'Document is subject to an active legal hold' }, { status: 409 })
    }
    const context = requestContext(request)
    await prisma.$transaction(async (tx) => {
      await tx.document.update({ where: { id }, data: { status: 'ARCHIVED' } })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'UPDATE', entityType: 'Document', entityId: id,
        oldValue: { status: existing.status }, newValue: { status: 'ARCHIVED' },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
    })
    return NextResponse.json({ success: true, archived: true })
  } catch (error) {
    return accessError(error)
  }
}
