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
    const clientId = searchParams.get('client')

    const pagination = parsePaginationParams(request, 'name')

    const where: Record<string, unknown> = {
      client: { firmId: user.firmId },
    }

    if (clientId) where.clientId = clientId

    const [bankAccounts, total] = await Promise.all([
      prisma.bankAccount.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          client: true,
          _count: { select: { transactions: true } },
        },
      }),
      prisma.bankAccount.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(bankAccounts, total, pagination))
  } catch (error) {
    console.error('Get bank accounts error:', error)
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

    const bankAccount = await prisma.bankAccount.create({
      data,
      include: { client: true },
    })

    return NextResponse.json(bankAccount)
  } catch (error) {
    console.error('Create bank account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
