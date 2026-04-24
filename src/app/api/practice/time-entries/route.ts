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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('user')

    const pagination = parsePaginationParams(request, 'date')

    const where: Record<string, unknown> = {
      user: { firmId: user.firmId },
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate)
    }
    if (userId) where.userId = userId

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          user: { select: { firstName: true, lastName: true } },
          engagement: { include: { client: true } },
        },
      }),
      prisma.timeEntry.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(entries, total, pagination))
  } catch (error) {
    console.error('Get time entries error:', error)
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

    const entry = await prisma.timeEntry.create({
      data: {
        ...data,
        userId: user.id,
        date: new Date(data.date),
        amount: data.isBillable && data.rate ? data.hours * data.rate : null,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        engagement: { include: { client: true } },
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Create time entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
