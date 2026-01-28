import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { exportInvoicesReport } from '@/lib/export'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format, status, startDate, endDate } = await request.json()

    if (!format || !['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Build query filters
    const where: any = { client: { firmId: user.firmId } }
    if (status) {
      where.status = status
    }
    if (startDate || endDate) {
      where.issueDate = {}
      if (startDate) where.issueDate.gte = new Date(startDate)
      if (endDate) where.issueDate.lte = new Date(endDate)
    }

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { name: true } },
      },
      orderBy: { issueDate: 'desc' },
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
    const buffer = await exportInvoicesReport(invoices, format, {
      firmName: firm?.name,
      dateRange,
    })

    // Set response headers
    const filename = `invoices-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting invoices:', error)
    return NextResponse.json({ error: 'Failed to export invoices' }, { status: 500 })
  }
}
