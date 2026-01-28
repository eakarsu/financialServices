import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { exportTransactionsReport } from '@/lib/export'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format, clientId, startDate, endDate } = await request.json()

    if (!format || !['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Build query filters
    const where: any = { client: { firmId: user.firmId } }
    if (clientId) {
      where.clientId = clientId
    }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        client: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Get firm name
    const firm = await prisma.firm.findUnique({
      where: { id: user.firmId },
      select: { name: true },
    })

    // Get client name if filtered
    let clientName: string | undefined
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { name: true },
      })
      clientName = client?.name
    }

    // Build date range string
    let dateRange: string | undefined
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : 'Beginning'
      const end = endDate ? new Date(endDate).toLocaleDateString() : 'Present'
      dateRange = `Period: ${start} - ${end}`
    }

    // Export report
    const buffer = await exportTransactionsReport(transactions, format, {
      firmName: firm?.name,
      dateRange,
      clientName,
    })

    // Set response headers
    const filename = `transactions-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json({ error: 'Failed to export transactions' }, { status: 500 })
  }
}
