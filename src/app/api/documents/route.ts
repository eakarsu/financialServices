import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission, Permission } from '@/lib/permissions'
import { parsePaginationParams, buildPaginatedResponse } from '@/lib/pagination'

const sortableFields = new Set(['createdAt', 'name', 'type', 'status', 'fileSize', 'version'])

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(user.role, Permission.VIEW_DOCUMENTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePaginationParams(request, 'createdAt')
    if (!sortableFields.has(pagination.sortBy)) pagination.sortBy = 'createdAt'
    const now = new Date()
    const elevated = user.role === 'ADMIN' || user.role === 'PARTNER'
    const grantScope: Prisma.DocumentWhereInput = {
      accessGrants: {
        some: {
          userId: user.id,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      },
    }
    const where: Prisma.DocumentWhereInput = {
      firmId: user.firmId,
      retentionDisposition: { not: 'DISPOSED' },
      AND: elevated ? [] : [
        { OR: [{ uploadedById: user.id }, { client: { assignments: { some: { userId: user.id } } } }, grantScope] },
        { OR: [{ isPrivileged: false }, grantScope] },
      ],
    }

    const clientId = searchParams.get('client')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    if (clientId) where.clientId = clientId
    if (type && type !== 'all') where.type = type as never
    if (status && status !== 'all') where.status = status as never
    if (search) where.name = { contains: search.slice(0, 100), mode: 'insensitive' }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          client: true,
          uploadedBy: { select: { firstName: true, lastName: true } },
          folder: true,
          legalHoldLinks: { where: { legalHold: { status: 'ACTIVE' } }, select: { legalHoldId: true } },
        },
      }),
      prisma.document.count({ where }),
    ])
    return NextResponse.json(buildPaginatedResponse(documents, total, pagination))
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Document bytes and provenance must be submitted to /api/upload' },
    { status: 405, headers: { Allow: 'GET' } }
  )
}
