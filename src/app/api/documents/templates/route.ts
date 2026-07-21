import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { hasPermission, Permission } from '@/lib/permissions'
import { fetchAuthoritativeTemplate } from '@/lib/providers/template-authority'
import { requestContext } from '@/lib/request-context'

export async function GET() {
  const user = await getCurrentUser()
  if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const now = new Date()
  const templates = await prisma.documentTemplate.findMany({
    where: {
      firmId: user.firmId, isActive: true, reviewStatus: 'APPROVED', effectiveDate: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(templates)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(user.role, Permission.MANAGE_TEMPLATES)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const input = await request.json()
    if (typeof input.name !== 'string' || !input.name.trim() || typeof input.category !== 'string' || !input.category.trim() || typeof input.authorityUrl !== 'string') {
      return NextResponse.json({ error: 'name, category, and authorityUrl are required' }, { status: 400 })
    }
    const source = await fetchAuthoritativeTemplate(input.authorityUrl)
    const context = requestContext(request)
    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.documentTemplate.create({
        data: {
          firmId: user.firmId!, createdById: user.id, name: input.name.trim().slice(0, 255),
          description: typeof input.description === 'string' ? input.description.slice(0, 2000) : null,
          category: input.category.trim().slice(0, 100), content: source.content,
          variables: source.variables as never, isActive: false, authorityName: source.authorityName,
          authorityUrl: input.authorityUrl, sourceEventId: source.sourceEventId,
          sourceTimestamp: source.sourceTimestamp, payloadDigest: source.payloadDigest,
          jurisdiction: source.jurisdiction, effectiveDate: source.effectiveDate,
          expiresAt: source.expiresAt, contentSha256: source.contentSha256, reviewStatus: 'PENDING',
        },
      })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'IMPORT', entityType: 'DocumentTemplate', entityId: created.id,
        newValue: {
          authorityName: created.authorityName, authorityUrl: created.authorityUrl,
          sourceEventId: created.sourceEventId, sourceTimestamp: created.sourceTimestamp,
          jurisdiction: created.jurisdiction, effectiveDate: created.effectiveDate, contentSha256: created.contentSha256,
        },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return created
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Create authoritative template error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Template import failed' }, { status: 502 })
  }
}
