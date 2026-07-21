import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

// ---------- Scoring algorithm ----------

interface ScoreComponents {
  incomeExpenseRatio: number   // income / expenses  (healthy: > 1.2)
  savingsRate: number          // (income - expenses) / income  (healthy: > 0.20)
  debtToIncome: number         // monthly debt / monthly income  (healthy: < 0.36)
  emergencyFundMonths: number  // liquid balance / avg monthly expense  (healthy: > 3)
}

/**
 * Compute a composite 0-100 financial health score.
 *
 * Weights:
 *   incomeExpenseRatio  — 30 pts
 *   savingsRate         — 30 pts
 *   debtToIncome        — 25 pts
 *   emergencyFundMonths — 15 pts
 */
function computeHealthScore(c: ScoreComponents): number {
  // Income/expense ratio sub-score (0-30)
  // ≤1.0 → 0, ≥1.5 → 30, linear between
  const ierScore = Math.min(30, Math.max(0, ((c.incomeExpenseRatio - 1) / 0.5) * 30))

  // Savings rate sub-score (0-30)
  // ≤0 → 0, ≥0.25 → 30, linear between
  const srScore = Math.min(30, Math.max(0, (c.savingsRate / 0.25) * 30))

  // Debt-to-income sub-score (0-25)
  // ≥0.50 → 0, ≤0.10 → 25, linear between
  const dtiScore = Math.min(25, Math.max(0, ((0.50 - c.debtToIncome) / 0.40) * 25))

  // Emergency fund sub-score (0-15)
  // 0 months → 0, ≥6 months → 15, linear between
  const efScore = Math.min(15, Math.max(0, (c.emergencyFundMonths / 6) * 15))

  return Math.round(ierScore + srScore + dtiScore + efScore)
}

// Deterministic narrative and thresholds. These are decision-support outputs,
// not personalized financial advice, and contain no generative model output.
function generateNarrativeAndRecommendations(
  score: number,
  components: ScoreComponents,
  clientType: string
): { narrative: string; recommendations: string[] } {
  const recommendations: string[] = []
  if (components.incomeExpenseRatio < 1.2) recommendations.push('Review verified income and expense records; investigate an income-to-expense ratio below 1.20.')
  if (components.savingsRate < 0.2) recommendations.push('Review a documented cash plan targeting a savings rate of at least 20%.')
  if (components.debtToIncome > 0.36) recommendations.push('Have a qualified reviewer assess obligations because measured debt-to-income exceeds 36%.')
  if (components.emergencyFundMonths < 3) recommendations.push('Review a documented liquidity plan targeting at least three months of verified expenses.')
  if (recommendations.length === 0) recommendations.push('Reconcile the source records and have a qualified professional confirm that current thresholds remain appropriate.')
  return {
    narrative: `${clientType} rules-based financial health score: ${score}/100. This deterministic screening result must be reviewed against source records by a qualified professional before action.`,
    recommendations: recommendations.slice(0, 3),
  }
}

// ---------- Route handler ----------

/**
 * GET /api/analytics/health-score?clientId=xxx&periodStart=2024-01-01&periodEnd=2024-12-31
 *
 * Returns the latest persisted score OR computes a fresh one if none exists
 * within the requested period. Pass ?refresh=true to force recomputation.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const forceRefresh = searchParams.get('refresh') === 'true'
    const periodStartParam = searchParams.get('periodStart')
    const periodEndParam = searchParams.get('periodEnd')

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    // Verify the client belongs to this firm
    const client = await prisma.client.findFirst({
      where: { id: clientId, firmId: user.firmId },
    })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Default period: last 12 months
    const periodEnd = periodEndParam ? new Date(periodEndParam) : new Date()
    const periodStart = periodStartParam
      ? new Date(periodStartParam)
      : new Date(new Date().setFullYear(periodEnd.getFullYear() - 1))

    // Return cached score unless refresh is requested
    if (!forceRefresh) {
      const existing = await prisma.financialHealthScore.findFirst({
        where: {
          clientId,
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
        orderBy: { computedAt: 'desc' },
      })
      if (existing) {
        return NextResponse.json({ ...existing, cached: true })
      }
    }

    // ---- Gather data from the DB ----

    // Transactions in the period
    const transactions = await prisma.transaction.findMany({
      where: {
        clientId,
        date: { gte: periodStart, lte: periodEnd },
        status: { not: 'EXCLUDED' },
      },
      select: { amount: true, type: true },
    })

    const totalIncome = transactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

    // Current bank account balances (liquid assets = emergency fund proxy)
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        clientId,
        isActive: true,
        accountType: { in: ['CHECKING', 'SAVINGS'] },
      },
      select: { balance: true },
    })

    const liquidBalance = bankAccounts.reduce(
      (sum, acct) => sum + parseFloat(acct.balance.toString()),
      0
    )

    // Outstanding invoices (receivables) — not used in score but useful for future
    // Payroll items as proxy for debt payments (recurring payroll obligations)
    const payrollItems = await prisma.payrollItem.findMany({
      where: {
        payrollRun: {
          clientId,
          payPeriodStart: { gte: periodStart },
          payPeriodEnd: { lte: periodEnd },
          status: { not: 'VOID' },
        },
      },
      select: { grossPay: true },
    })

    // Monthly averages
    const months =
      Math.max(
        1,
        Math.round(
          (periodEnd.getTime() - periodStart.getTime()) / (30 * 24 * 60 * 60 * 1000)
        )
      )

    const avgMonthlyIncome = totalIncome / months
    const avgMonthlyExpenses = totalExpenses / months

    // Debt-to-income: total payroll (as obligation proxy) / total income
    const totalPayrollGross = payrollItems.reduce(
      (sum, item) => sum + parseFloat(item.grossPay.toString()),
      0
    )
    const debtToIncome =
      avgMonthlyIncome > 0 ? (totalPayrollGross / months) / avgMonthlyIncome : 0

    const incomeExpenseRatio =
      avgMonthlyExpenses > 0 ? avgMonthlyIncome / avgMonthlyExpenses : 2

    const savingsRate =
      avgMonthlyIncome > 0
        ? (avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome
        : 0

    const emergencyFundMonths =
      avgMonthlyExpenses > 0 ? liquidBalance / avgMonthlyExpenses : 0

    const components: ScoreComponents = {
      incomeExpenseRatio: Math.max(0, incomeExpenseRatio),
      savingsRate: Math.min(1, Math.max(-1, savingsRate)),
      debtToIncome: Math.min(1, Math.max(0, debtToIncome)),
      emergencyFundMonths: Math.max(0, emergencyFundMonths),
    }

    const score = computeHealthScore(components)

    // AI narrative + recommendations
    const { narrative, recommendations } = await generateNarrativeAndRecommendations(
      score,
      components,
      client.type
    )

    // Persist the score for trend tracking
    const healthScore = await prisma.financialHealthScore.create({
      data: {
        clientId,
        score,
        incomeExpenseRatio: components.incomeExpenseRatio,
        savingsRate: components.savingsRate,
        debtToIncome: components.debtToIncome,
        emergencyFundMonths: components.emergencyFundMonths,
        narrative,
        recommendations,
        periodStart,
        periodEnd,
      },
    })

    return NextResponse.json({ ...healthScore, cached: false })
  } catch (error) {
    console.error('Health score error:', error)
    return NextResponse.json({ error: 'Failed to compute health score' }, { status: 500 })
  }
}

/**
 * GET /api/analytics/health-score/history?clientId=xxx&limit=12
 * Returns score history for trend charts — exposed via the same route with ?history=true
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, limit = 12 } = await request.json()
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    // Verify client belongs to firm
    const client = await prisma.client.findFirst({
      where: { id: clientId, firmId: user.firmId },
      select: { id: true },
    })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const history = await prisma.financialHealthScore.findMany({
      where: { clientId },
      orderBy: { computedAt: 'desc' },
      take: Number(limit),
      select: {
        id: true,
        score: true,
        incomeExpenseRatio: true,
        savingsRate: true,
        debtToIncome: true,
        emergencyFundMonths: true,
        periodStart: true,
        periodEnd: true,
        computedAt: true,
      },
    })

    return NextResponse.json({ history: history.reverse() }) // chronological order
  } catch (error) {
    console.error('Health score history error:', error)
    return NextResponse.json({ error: 'Failed to fetch health score history' }, { status: 500 })
  }
}
