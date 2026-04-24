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
    const status = searchParams.get('status')

    const pagination = parsePaginationParams(request, 'lastName')

    const where: Record<string, unknown> = {
      client: { firmId: user.firmId },
    }

    if (clientId) where.clientId = clientId
    if (status && status !== 'all') where.status = status

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          client: true,
        },
      }),
      prisma.employee.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(employees, total, pagination))
  } catch (error) {
    console.error('Get employees error:', error)
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

    const lastEmployee = await prisma.employee.findFirst({
      where: { clientId: data.clientId },
      orderBy: { employeeNumber: 'desc' },
    })
    const nextNumber = lastEmployee ? parseInt(lastEmployee.employeeNumber.replace('EMP-', '')) + 1 : 1
    const employeeNumber = `EMP-${nextNumber.toString().padStart(4, '0')}`

    const employee = await prisma.employee.create({
      data: {
        ...data,
        employeeNumber,
        hireDate: new Date(data.hireDate),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      },
      include: { client: true },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
