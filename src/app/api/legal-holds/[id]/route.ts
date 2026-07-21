import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { requestContext } from '@/lib/request-context'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'PARTNER'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const input = await request.json()
    if (typeof input.releaseReason !== 'string' || !input.releaseReason.trim()) {
      return NextResponse.json({ error: 'releaseReason is required' }, { status: 400 })
    }
    const hold = await prisma.legalHold.findFirst({
      where: { id, firmId: user.firmId }, include: { documents: { select: { documentId: true } } },
    })
    if (!hold) return NextResponse.json({ error: 'Legal hold not found' }, { status: 404 })
    if (hold.status !== 'ACTIVE') return NextResponse.json({ error: 'Legal hold is already released' }, { status: 409 })
    const context = requestContext(request)
    const released = await prisma.$transaction(async (tx) => {
      const updated = await tx.legalHold.update({
        where: { id },
        data: { status: 'RELEASED', releasedAt: new Date(), releasedById: user.id, releaseReason: input.releaseReason.trim().slice(0, 4000) },
      })
      for (const link of hold.documents) {
        const otherActive = await tx.legalHoldDocument.count({
          where: { documentId: link.documentId, legalHold: { status: 'ACTIVE', id: { not: id } } },
        })
        if (!otherActive) {
          const document = await tx.document.findUniqueOrThrow({ where: { id: link.documentId }, select: { retainUntil: true } })
          await tx.document.update({
            where: { id: link.documentId },
            data: { retentionDisposition: document.retainUntil && document.retainUntil <= new Date() ? 'ELIGIBLE' : 'ACTIVE' },
          })
        }
      }
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'HOLD_RELEASED', entityType: 'LegalHold', entityId: id,
        oldValue: { status: hold.status }, newValue: { status: 'RELEASED', releaseReason: input.releaseReason.trim() },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return updated
    })
    return NextResponse.json(released)
  } catch (error) {
    console.error('Release legal hold error:', error)
    return NextResponse.json({ error: 'Legal hold release failed' }, { status: 500 })
  }
}
