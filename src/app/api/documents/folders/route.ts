import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { hasPermission, Permission } from '@/lib/permissions'
import { requestContext } from '@/lib/request-context'

export async function GET() {
  const user = await getCurrentUser()
  if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user.role, Permission.VIEW_DOCUMENTS)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const folders = await prisma.documentFolder.findMany({
    where: { firmId: user.firmId },
    include: { children: { where: { firmId: user.firmId } }, _count: { select: { documents: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(folders)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(user.role, Permission.EDIT_DOCUMENTS)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const input = await request.json()
    if (typeof input.name !== 'string' || !input.name.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const parentId = typeof input.parentId === 'string' ? input.parentId : null
    if (parentId) {
      const parent = await prisma.documentFolder.findFirst({ where: { id: parentId, firmId: user.firmId } })
      if (!parent) return NextResponse.json({ error: 'Parent folder not found in firm' }, { status: 404 })
    }
    const context = requestContext(request)
    const folder = await prisma.$transaction(async (tx) => {
      const created = await tx.documentFolder.create({ data: { name: input.name.trim().slice(0, 255), parentId, firmId: user.firmId! } })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'CREATE', entityType: 'DocumentFolder', entityId: created.id,
        newValue: { name: created.name, parentId }, ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return created
    })
    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json({ error: 'Folder creation failed' }, { status: 500 })
  }
}
