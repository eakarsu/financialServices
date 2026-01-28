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

    const payrollRuns = await prisma.payrollRun.findMany({
      where,
      orderBy: { payDate: 'desc' },
      include: {
        client: true,
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { employee: true },
        },
      },
    })

    return NextResponse.json(payrollRuns)
  } catch (error) {
    console.error('Get payroll runs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, payPeriodStart, payPeriodEnd, payDate, employees } = await request.json()

    // Calculate payroll for each employee
    const items = employees.map((emp: { employeeId: string; regularHours: number; overtimeHours: number; payRate: number }) => {
      const regularPay = emp.regularHours * emp.payRate
      const overtimePay = emp.overtimeHours * emp.payRate * 1.5
      const grossPay = regularPay + overtimePay

      // Simplified tax calculations
      const federalTax = grossPay * 0.12
      const stateTax = grossPay * 0.05
      const socialSecurity = grossPay * 0.062
      const medicare = grossPay * 0.0145
      const netPay = grossPay - federalTax - stateTax - socialSecurity - medicare

      return {
        employeeId: emp.employeeId,
        regularHours: emp.regularHours,
        overtimeHours: emp.overtimeHours,
        regularPay,
        overtimePay,
        grossPay,
        federalTax,
        stateTax,
        socialSecurity,
        medicare,
        otherDeductions: 0,
        netPay,
      }
    })

    const totals = items.reduce((acc: { gross: number; net: number; taxes: number }, item: { grossPay: number; netPay: number; federalTax: number; stateTax: number; socialSecurity: number; medicare: number }) => ({
      gross: acc.gross + item.grossPay,
      net: acc.net + item.netPay,
      taxes: acc.taxes + item.federalTax + item.stateTax + item.socialSecurity + item.medicare,
    }), { gross: 0, net: 0, taxes: 0 })

    const payrollRun = await prisma.payrollRun.create({
      data: {
        clientId,
        createdById: user.id,
        payPeriodStart: new Date(payPeriodStart),
        payPeriodEnd: new Date(payPeriodEnd),
        payDate: new Date(payDate),
        status: 'DRAFT',
        totalGross: totals.gross,
        totalNet: totals.net,
        totalTaxes: totals.taxes,
        totalDeductions: 0,
        employeeCount: items.length,
        items: {
          create: items,
        },
      },
      include: {
        client: true,
        items: { include: { employee: true } },
      },
    })

    return NextResponse.json(payrollRun)
  } catch (error) {
    console.error('Create payroll run error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
