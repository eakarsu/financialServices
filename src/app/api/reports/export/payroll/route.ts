import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { exportPayrollReport } from '@/lib/export'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format, startDate, endDate } = await request.json()

    if (!format || !['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Build query filters
    const where: any = { client: { firmId: user.firmId } }
    if (startDate || endDate) {
      where.payPeriodStart = {}
      if (startDate) where.payPeriodStart.gte = new Date(startDate)
      if (endDate) where.payPeriodStart.lte = new Date(endDate)
    }

    // Get payroll runs
    const payrollRuns = await prisma.payrollRun.findMany({
      where,
      include: {
        client: { select: { businessName: true, firstName: true, lastName: true } },
      },
      orderBy: { payPeriodStart: 'desc' },
    })

    // Get firm name
    const firm = await prisma.firm.findUnique({
      where: { id: user.firmId },
      select: { name: true },
    })

    // Build date range string
    let dateRange: string | undefined
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : 'Beginning'
      const end = endDate ? new Date(endDate).toLocaleDateString() : 'Present'
      dateRange = `Period: ${start} - ${end}`
    }

    // Export report
    const buffer = await exportPayrollReport(payrollRuns, format, {
      firmName: firm?.name,
      dateRange,
    })

    // Set response headers
    const filename = `payroll-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting payroll:', error)
    return NextResponse.json({ error: 'Failed to export payroll' }, { status: 500 })
  }
}
