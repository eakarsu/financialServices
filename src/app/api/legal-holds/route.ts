import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { requestContext } from '@/lib/request-context'

export async function GET() {
  const user = await getCurrentUser()
  if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'PARTNER'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const holds = await prisma.legalHold.findMany({
    where: { firmId: user.firmId },
    include: { documents: { include: { document: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(holds)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'PARTNER'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const input = await request.json()
    if (![input.name, input.reason, input.authority, input.matterRef].every((value) => typeof value === 'string' && value.trim())) {
      return NextResponse.json({ error: 'name, reason, authority, and matterRef are required' }, { status: 400 })
    }
    if (!Array.isArray(input.documentIds) || input.documentIds.length === 0 || input.documentIds.some((id: unknown) => typeof id !== 'string')) {
      return NextResponse.json({ error: 'At least one documentId is required' }, { status: 400 })
    }
    const documentIds = Array.from(new Set(input.documentIds as string[]))
    const documents = await prisma.document.findMany({ where: { id: { in: documentIds }, firmId: user.firmId } })
    if (documents.length !== documentIds.length) return NextResponse.json({ error: 'A document is outside the firm' }, { status: 403 })
    const clientId = typeof input.clientId === 'string' ? input.clientId : null
    if (clientId && documents.some((document) => document.clientId !== clientId)) {
      return NextResponse.json({ error: 'All held documents must belong to the stated client matter' }, { status: 400 })
    }
    const context = requestContext(request)
    const hold = await prisma.$transaction(async (tx) => {
      const created = await tx.legalHold.create({
        data: {
          firmId: user.firmId!, clientId, createdById: user.id,
          name: input.name.trim().slice(0, 255), reason: input.reason.trim().slice(0, 4000),
          authority: input.authority.trim().slice(0, 255), matterRef: input.matterRef.trim().slice(0, 255),
          effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : new Date(),
          documents: { create: documentIds.map((documentId) => ({ documentId })) },
        },
      })
      await tx.document.updateMany({ where: { id: { in: documentIds } }, data: { retentionDisposition: 'BLOCKED_BY_HOLD' } })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'HOLD_PLACED', entityType: 'LegalHold', entityId: created.id,
        newValue: { matterRef: created.matterRef, documentIds, authority: created.authority },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return created
    })
    return NextResponse.json(hold, { status: 201 })
  } catch (error) {
    console.error('Place legal hold error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Legal hold failed' }, { status: 400 })
  }
}
