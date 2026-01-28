import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client')

    const where: Record<string, unknown> = {
      client: { firmId: user.firmId },
    }

    if (clientId) where.clientId = clientId

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { lastName: 'asc' },
      include: {
        client: true,
      },
    })

    return NextResponse.json(employees)
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

    // Generate employee number
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
