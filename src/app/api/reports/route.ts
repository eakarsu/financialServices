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
    const type = searchParams.get('type')
    const clientId = searchParams.get('client')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!type || !clientId) {
      return NextResponse.json({ error: 'Type and client required' }, { status: 400 })
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, firmId: user.firmId },
    })

    if (!client) {
      console.error('Client not found:', clientId, 'firmId:', user.firmId)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    console.log('Generating report for client:', client.businessName || `${client.firstName} ${client.lastName}`, 'ID:', clientId)

    const chartOfAccounts = await prisma.chartOfAccount.findMany({
      where: { firmId: user.firmId },
    })

    const transactions = await prisma.transaction.findMany({
      where: {
        clientId,
        date: {
          gte: startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1),
          lte: endDate ? new Date(endDate) : new Date(),
        },
        status: 'CATEGORIZED',
      },
      include: { category: true },
    })

    console.log('Found transactions:', transactions.length, 'for date range:', startDate, 'to', endDate)

    // Generate report based on type
    let reportData: Record<string, unknown> = {}

    if (type === 'PROFIT_LOSS' || type === 'report-009') {
      console.log('Transactions with categories:', transactions.map(t => ({
        desc: t.description,
        amount: t.amount,
        categoryType: t.category?.type,
        categoryName: t.category?.name
      })))

      const revenue = transactions
        .filter(t => t.category?.type === 'REVENUE')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const expenses = transactions
        .filter(t => t.category?.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      console.log('Revenue:', revenue, 'Expenses:', expenses)

      reportData = {
        revenue,
        expenses,
        netIncome: revenue - expenses,
        byCategory: chartOfAccounts
          .filter(a => ['REVENUE', 'EXPENSE'].includes(a.type))
          .map(a => ({
            account: a,
            total: transactions
              .filter(t => t.categoryId === a.id)
              .reduce((sum, t) => sum + Number(t.amount), 0),
          }))
          .filter(a => a.total !== 0),
      }
    } else if (type === 'BALANCE_SHEET' || type === 'report-010') {
      const assets = chartOfAccounts.filter(a => a.type === 'ASSET')
      const liabilities = chartOfAccounts.filter(a => a.type === 'LIABILITY')
      const equity = chartOfAccounts.filter(a => a.type === 'EQUITY')

      // Calculate balances from transactions
      const assetBalances = assets.map(a => ({
        account: a,
        balance: transactions
          .filter(t => t.categoryId === a.id)
          .reduce((sum, t) => sum + Number(t.amount), 0),
      })).filter(a => a.balance !== 0)

      const liabilityBalances = liabilities.map(a => ({
        account: a,
        balance: transactions
          .filter(t => t.categoryId === a.id)
          .reduce((sum, t) => sum + Number(t.amount), 0),
      })).filter(a => a.balance !== 0)

      const equityBalances = equity.map(a => ({
        account: a,
        balance: transactions
          .filter(t => t.categoryId === a.id)
          .reduce((sum, t) => sum + Number(t.amount), 0),
      })).filter(a => a.balance !== 0)

      // Calculate totals
      const totalAssets = assetBalances.reduce((sum, a) => sum + a.balance, 0)
      const totalLiabilities = liabilityBalances.reduce((sum, a) => sum + a.balance, 0)

      // Add retained earnings (net income) to equity
      const revenue = transactions
        .filter(t => t.category?.type === 'REVENUE')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const expenses = transactions
        .filter(t => t.category?.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const retainedEarnings = revenue - expenses

      const totalEquity = equityBalances.reduce((sum, a) => sum + a.balance, 0) + retainedEarnings

      reportData = {
        assets: assetBalances,
        liabilities: liabilityBalances,
        equity: equityBalances,
        retainedEarnings,
        totalAssets,
        totalLiabilities,
        totalEquity,
      }
    } else if (type === 'report-012' || type === 'AR_AGING') {
      // Accounts Receivable Aging Report
      const invoices = await prisma.invoice.findMany({
        where: {
          clientId,
          status: { in: ['SENT', 'OVERDUE', 'PARTIAL'] },
        },
        include: { client: true },
      })

      console.log('AR Aging Report - Found invoices:', invoices.length, 'with status SENT, OVERDUE, or PARTIAL')

      const today = new Date()
      const aging = {
        current: [] as typeof invoices,
        thirtyDays: [] as typeof invoices,
        sixtyDays: [] as typeof invoices,
        ninetyDays: [] as typeof invoices,
        overNinety: [] as typeof invoices,
      }

      invoices.forEach(invoice => {
        const dueDate = new Date(invoice.dueDate)
        const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysPastDue <= 0) {
          aging.current.push(invoice)
        } else if (daysPastDue <= 30) {
          aging.thirtyDays.push(invoice)
        } else if (daysPastDue <= 60) {
          aging.sixtyDays.push(invoice)
        } else if (daysPastDue <= 90) {
          aging.ninetyDays.push(invoice)
        } else {
          aging.overNinety.push(invoice)
        }
      })

      reportData = {
        aging,
        totals: {
          current: aging.current.reduce((sum, inv) => sum + Number(inv.total), 0),
          thirtyDays: aging.thirtyDays.reduce((sum, inv) => sum + Number(inv.total), 0),
          sixtyDays: aging.sixtyDays.reduce((sum, inv) => sum + Number(inv.total), 0),
          ninetyDays: aging.ninetyDays.reduce((sum, inv) => sum + Number(inv.total), 0),
          overNinety: aging.overNinety.reduce((sum, inv) => sum + Number(inv.total), 0),
        },
        totalOutstanding: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
      }
    } else if (type === 'CASH_FLOW' || type === 'report-011') {
      // Cash Flow Statement
      const revenue = transactions
        .filter(t => t.category?.type === 'REVENUE')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const expenses = transactions
        .filter(t => t.category?.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const cashFromOperations = revenue - expenses

      reportData = {
        operatingActivities: {
          revenue,
          expenses,
          netCashFromOperations: cashFromOperations,
        },
        investingActivities: {
          netCashFromInvesting: 0,
        },
        financingActivities: {
          netCashFromFinancing: 0,
        },
        netCashChange: cashFromOperations,
        beginningCash: 0,
        endingCash: cashFromOperations,
      }
    }

    return NextResponse.json({
      type,
      client,
      startDate,
      endDate,
      generatedAt: new Date(),
      data: reportData,
    })
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
