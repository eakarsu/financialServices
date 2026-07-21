import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { hasPermission, Permission } from '@/lib/permissions'
import { requestContext } from '@/lib/request-context'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(user.role, Permission.MANAGE_TEMPLATES)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const template = await prisma.documentTemplate.findFirst({ where: { id, firmId: user.firmId } })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    if (template.createdById === user.id) return NextResponse.json({ error: 'Template importer cannot approve their own source' }, { status: 403 })
    if (template.reviewStatus !== 'PENDING') return NextResponse.json({ error: 'Template is not pending review' }, { status: 409 })
    const input = await request.json()
    if (!['APPROVED', 'REJECTED'].includes(input.decision) || typeof input.note !== 'string' || !input.note.trim()) {
      return NextResponse.json({ error: 'decision and review note are required' }, { status: 400 })
    }
    if (input.decision === 'APPROVED' && template.expiresAt && template.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'Expired authority material cannot be approved' }, { status: 409 })
    }
    const context = requestContext(request)
    const reviewed = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentTemplate.update({
        where: { id },
        data: { reviewStatus: input.decision, reviewedById: user.id, reviewedAt: new Date(), isActive: input.decision === 'APPROVED' },
      })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'REVIEWED', entityType: 'DocumentTemplate', entityId: id,
        oldValue: { reviewStatus: template.reviewStatus },
        newValue: { reviewStatus: input.decision, note: input.note.trim(), contentSha256: template.contentSha256 },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return updated
    })
    return NextResponse.json(reviewed)
  } catch (error) {
    console.error('Review template error:', error)
    return NextResponse.json({ error: 'Template review failed' }, { status: 500 })
  }
}
