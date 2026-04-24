import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateClientNumber } from '@/lib/utils'
import { Permission, hasPermission } from '@/lib/permissions'
import { parsePaginationParams, buildPaginatedResponse } from '@/lib/pagination'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.VIEW_CLIENTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const pagination = parsePaginationParams(request, 'createdAt')

    const where: Record<string, unknown> = { firmId: user.firmId }

    if (status && status !== 'all') {
      where.status = status
    }
    if (type && type !== 'all') {
      where.type = type
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { clientNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          contacts: { where: { isPrimary: true }, take: 1 },
          _count: {
            select: {
              documents: true,
              engagements: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(clients, total, pagination))
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.CREATE_CLIENTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()

    const cleanData: Record<string, unknown> = {
      type: data.type || 'INDIVIDUAL',
      status: data.status || 'ACTIVE',
      clientNumber: generateClientNumber(),
      firmId: user.firmId,
    }

    if (data.firstName) cleanData.firstName = data.firstName
    if (data.lastName) cleanData.lastName = data.lastName
    if (data.businessName) cleanData.businessName = data.businessName
    if (data.email) cleanData.email = data.email
    if (data.phone) cleanData.phone = data.phone
    if (data.address) cleanData.address = data.address
    if (data.city) cleanData.city = data.city
    if (data.state) cleanData.state = data.state
    if (data.zipCode) cleanData.zipCode = data.zipCode
    if (data.entityType) cleanData.entityType = data.entityType
    if (data.taxIdNumber) cleanData.taxIdNumber = data.taxIdNumber
    if (data.notes) cleanData.notes = data.notes

    const client = await prisma.client.create({
      data: cleanData as any,
      include: {
        contacts: true,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
