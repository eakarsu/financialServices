import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { requestContext } from '@/lib/request-context'

const levels = new Set(['VIEW', 'EDIT', 'MANAGE'])

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getCurrentUser()
    if (!actor?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const document = await getDocumentForAccess(id, actor, 'MANAGE')
    const input = await request.json()
    if (typeof input.userId !== 'string' || !levels.has(input.accessLevel) || typeof input.reason !== 'string' || !input.reason.trim()) {
      return NextResponse.json({ error: 'userId, accessLevel, and reason are required' }, { status: 400 })
    }
    if ((document.isPrivileged || input.accessLevel === 'MANAGE') && !['ADMIN', 'PARTNER'].includes(actor.role)) {
      return NextResponse.json({ error: 'Firm leadership must authorize privileged/manage access' }, { status: 403 })
    }
    const target = await prisma.user.findFirst({ where: { id: input.userId, firmId: actor.firmId, isActive: true } })
    if (!target) return NextResponse.json({ error: 'Target user not found in firm' }, { status: 404 })
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null
    if (expiresAt && (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.valueOf()) || expiresAt <= new Date())) {
      return NextResponse.json({ error: 'Expiration must be in the future' }, { status: 400 })
    }
    const context = requestContext(request)
    const grant = await prisma.$transaction(async (tx) => {
      const saved = await tx.documentAccessGrant.upsert({
        where: { documentId_userId: { documentId: id, userId: target.id } },
        create: {
          firmId: actor.firmId!, documentId: id, userId: target.id, grantedById: actor.id,
          accessLevel: input.accessLevel, expiresAt, reason: input.reason.trim().slice(0, 1000),
        },
        update: {
          grantedById: actor.id, accessLevel: input.accessLevel, expiresAt,
          reason: input.reason.trim().slice(0, 1000), revokedAt: null,
        },
      })
      await appendAuditEventTx(tx, {
        firmId: actor.firmId!, actorId: actor.id, requestId: context.requestId,
        action: 'ACCESS_GRANTED', entityType: 'Document', entityId: id,
        newValue: { userId: target.id, accessLevel: saved.accessLevel, expiresAt: saved.expiresAt, reason: saved.reason },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return saved
    })
    return NextResponse.json(grant, { status: 201 })
  } catch (error) {
    if (error instanceof DocumentAccessError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Grant document access error:', error)
    return NextResponse.json({ error: 'Access grant failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getCurrentUser()
    if (!actor?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await getDocumentForAccess(id, actor, 'MANAGE')
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    const existing = await prisma.documentAccessGrant.findFirst({ where: { documentId: id, userId, firmId: actor.firmId } })
    if (!existing) return NextResponse.json({ error: 'Grant not found' }, { status: 404 })
    const context = requestContext(request)
    await prisma.$transaction(async (tx) => {
      await tx.documentAccessGrant.update({ where: { id: existing.id }, data: { revokedAt: new Date() } })
      await appendAuditEventTx(tx, {
        firmId: actor.firmId!, actorId: actor.id, requestId: context.requestId,
        action: 'ACCESS_REVOKED', entityType: 'Document', entityId: id,
        oldValue: { userId, accessLevel: existing.accessLevel }, newValue: { userId, revoked: true },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DocumentAccessError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Revoke document access error:', error)
    return NextResponse.json({ error: 'Access revocation failed' }, { status: 500 })
  }
}
