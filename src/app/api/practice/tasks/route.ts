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
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedTo')

    const pagination = parsePaginationParams(request, 'createdAt')

    const where: Record<string, unknown> = {
      OR: [
        { client: { firmId: user.firmId } },
        { assignedTo: { firmId: user.firmId } },
      ],
    }

    if (status && status !== 'all') where.status = status
    if (assignedToId) where.assignedToId = assignedToId

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          client: true,
          assignedTo: { select: { firstName: true, lastName: true } },
          engagement: true,
        },
      }),
      prisma.task.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(tasks, total, pagination))
  } catch (error) {
    console.error('Get tasks error:', error)
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

    const cleanData: Record<string, unknown> = {
      title: data.title,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'TODO',
    }

    if (data.description) cleanData.description = data.description
    if (data.dueDate) cleanData.dueDate = new Date(data.dueDate)
    if (data.clientId) cleanData.clientId = data.clientId
    if (data.assignedToId) cleanData.assignedToId = data.assignedToId
    if (data.engagementId) cleanData.engagementId = data.engagementId

    const task = await prisma.task.create({
      data: cleanData as any,
      include: {
        client: true,
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
