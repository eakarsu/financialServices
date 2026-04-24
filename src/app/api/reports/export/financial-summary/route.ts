import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { exportFinancialSummary } from '@/lib/export'
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

    // Calculate date range (default to last 12 months)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getFullYear() - 1, end.getMonth(), 1)

    // Get all transactions (revenue and expenses)
    const transactions = await prisma.transaction.findMany({
      where: {
        client: { firmId: user.firmId },
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    })

    // Group by month
    const monthlyData = new Map<string, { revenue: number; expenses: number }>()

    transactions.forEach(tx => {
      const monthKey = new Date(tx.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      const existing = monthlyData.get(monthKey) || { revenue: 0, expenses: 0 }

      if (tx.type === 'CREDIT') {
        existing.revenue += Number(tx.amount)
      } else {
        existing.expenses += Number(tx.amount)
      }

      monthlyData.set(monthKey, existing)
    })

    // Convert to arrays
    const revenue: { month: string; amount: number }[] = []
    const expenses: { month: string; amount: number }[] = []
    const profitLoss: { month: string; revenue: number; expenses: number; profit: number }[] = []

    monthlyData.forEach((data, month) => {
      revenue.push({ month, amount: data.revenue })
      expenses.push({ month, amount: data.expenses })
      profitLoss.push({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      })
    })

    // Get firm name
    const firm = await prisma.firm.findUnique({
      where: { id: user.firmId },
      select: { name: true },
    })

    // Build date range string
    const dateRange = `Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`

    // Export report
    const buffer = await exportFinancialSummary(
      { revenue, expenses, profitLoss },
      format,
      {
        firmName: firm?.name,
        dateRange,
      }
    )

    // Set response headers
    const filename = `financial-summary-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting financial summary:', error)
    return NextResponse.json({ error: 'Failed to export financial summary' }, { status: 500 })
  }
}
