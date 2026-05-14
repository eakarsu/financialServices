import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { parsePaginationParams, buildPaginatedResponse } from '@/lib/pagination'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get('upcoming') === 'true'

    const where: Record<string, unknown> = {}

    if (upcoming) {
      where.dueDate = { gte: new Date() }
    }

    const pagination = parsePaginationParams(request, 'dueDate')
    pagination.sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'

    const [deadlines, total] = await Promise.all([
      prisma.taxDeadline.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.taxDeadline.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(deadlines, total, pagination))
  } catch (error) {
    console.error('Get deadlines error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const deadline = await prisma.taxDeadline.create({
      data: {
        ...data,
        baseDate: new Date(data.baseDate),
        dueDate: new Date(data.dueDate),
        extendedDate: data.extendedDate ? new Date(data.extendedDate) : null,
      },
    })

    return NextResponse.json(deadline)
  } catch (error) {
    console.error('Create deadline error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
