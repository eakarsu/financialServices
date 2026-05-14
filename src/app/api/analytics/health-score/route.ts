import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'

// ---------- AI helper ----------

function extractJSON(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/)
  if (codeBlock) return codeBlock[1]
  const direct = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (direct) return direct[1]
  return text
}

async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured')

  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'X-Title': 'Financial Services AI Platform',
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages, temperature: 0.7, max_tokens: 1500 }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter API error: ${err}`)
  }

  const data = await response.json()
  return extractJSON(data.choices[0]?.message?.content || '')
}

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

// ---------- AI narrative + recommendations ----------

async function generateNarrativeAndRecommendations(
  score: number,
  components: ScoreComponents,
  clientType: string
): Promise<{ narrative: string; recommendations: string[] }> {
  const systemPrompt = `You are a senior financial advisor at a CPA firm. Provide a concise, professional financial health assessment. Return JSON only: {"narrative": "2-3 sentence assessment", "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]}`

  const prompt = `Client financial health score: ${score}/100

Components:
- Income-to-Expense Ratio: ${components.incomeExpenseRatio.toFixed(2)} (healthy > 1.2)
- Savings Rate: ${(components.savingsRate * 100).toFixed(1)}% (healthy > 20%)
- Debt-to-Income Ratio: ${(components.debtToIncome * 100).toFixed(1)}% (healthy < 36%)
- Emergency Fund: ${components.emergencyFundMonths.toFixed(1)} months (healthy > 3)
- Client type: ${clientType}

Provide a 2-3 sentence narrative and exactly 3 specific, actionable recommendations.`

  try {
    const response = await callOpenRouter(prompt, systemPrompt)
    const parsed = JSON.parse(response)
    return {
      narrative: parsed.narrative || 'Financial health assessment unavailable.',
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 3)
        : ['Review spending patterns.', 'Build emergency savings.', 'Reduce debt obligations.'],
    }
  } catch (error) {
    console.error('Health score AI generation error:', error)
    return {
      narrative: `The client has a financial health score of ${score}/100. Review the component metrics for detailed insights.`,
      recommendations: [
        'Review income-to-expense ratio and identify cost reduction opportunities.',
        'Establish or increase emergency fund to cover 3-6 months of expenses.',
        'Develop a debt reduction plan targeting high-interest obligations first.',
      ],
    }
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
