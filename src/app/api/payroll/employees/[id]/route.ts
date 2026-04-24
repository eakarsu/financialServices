import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        client: true,
        payrollItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { payrollRun: true },
        },
        taxForms: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        status: data.status,
        payType: data.payType,
        payRate: data.payRate,
        payFrequency: data.payFrequency,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if there are payroll items associated with this employee
    const paystubCount = await prisma.payrollItem.count({
      where: { employeeId: id },
    })

    if (paystubCount > 0) {
      // Soft delete - set status to TERMINATED instead of deleting
      await prisma.employee.update({
        where: { id },
        data: {
          status: 'TERMINATED',
          terminationDate: new Date(),
        },
      })
      return NextResponse.json({ success: true, softDeleted: true })
    }

    await prisma.employee.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
