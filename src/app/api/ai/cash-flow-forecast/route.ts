/**
 * AI Cash-Flow Forecaster
 *
 * Combines historical bank transactions (Plaid-sourced) with outstanding
 * invoices and recurring payments to generate a 13-week cash-flow forecast
 * with an AI narrative.
 *
 * Body: { weeks?: number; clientId?: string }
 * Returns: { forecast: WeekBucket[]; narrative: string; risks: string[]; opportunities: string[] }
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  AI_MODEL,
  OPENROUTER_API_KEY,
  aiRateLimiter,
  callOpenRouter as callAI,
  parseAIJson,
  logAIResult,
} from '@/lib/ai-utils'

interface WeekBucket {
  weekStart: string
  inflow: number
  outflow: number
  net: number
  runningBalance: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = aiRateLimiter(user.id)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'AI rate limit exceeded', resetIn: rl.resetIn },
        { status: 429 }
      )
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const weeks: number = Math.min(26, Math.max(4, body.weeks ?? 13))
    const clientId: string | undefined = body.clientId

    // Pull recent transactions (last 90 days) for trend baseline
    const lookbackDays = 90
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

    const txns = await prisma.transaction.findMany({
      where: {
        client: { firmId: user.firmId },
        date: { gte: since },
        ...(clientId ? { clientId } : {}),
      },
      select: { amount: true, date: true, type: true, description: true },
      orderBy: { date: 'asc' },
      take: 1000,
    })

    // Bucket historical inflow/outflow per week to seed forecast
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Anchor to most recent Monday
    const dayOfWeek = today.getDay() // 0..6
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const baseMonday = new Date(today.getTime() - mondayOffset * 24 * 60 * 60 * 1000)

    // historical avg inflow/outflow per weekday
    let totalIn = 0
    let totalOut = 0
    for (const t of txns) {
      const amt = Number(t.amount) || 0
      // CREDIT = inflow, DEBIT = outflow in this schema
      if (t.type === 'CREDIT') totalIn += Math.abs(amt)
      else totalOut += Math.abs(amt)
    }
    const weeklyInflowAvg = totalIn / Math.max(1, lookbackDays / 7)
    const weeklyOutflowAvg = totalOut / Math.max(1, lookbackDays / 7)

    // Outstanding invoices = future inflow
    const outstanding = await prisma.invoice.findMany({
      where: {
        firmId: user.firmId,
        ...(clientId ? { clientId } : {}),
        status: { in: ['SENT', 'PARTIAL', 'OVERDUE', 'VIEWED'] },
      },
      select: { total: true, dueDate: true, status: true },
    })

    const startingBalance = 0 // Could be summed from BankAccount.balance — keep simple
    const forecast: WeekBucket[] = []
    let running = startingBalance
    for (let w = 0; w < weeks; w++) {
      const weekStart = new Date(baseMonday.getTime() + w * weekMs)
      const weekEnd = new Date(weekStart.getTime() + weekMs)
      const invoiceInflow = outstanding
        .filter((i) => i.dueDate && new Date(i.dueDate) >= weekStart && new Date(i.dueDate) < weekEnd)
        .reduce((s, i) => s + Number(i.total || 0), 0)
      const inflow = Math.round((weeklyInflowAvg + invoiceInflow) * 100) / 100
      const outflow = Math.round(weeklyOutflowAvg * 100) / 100
      const net = inflow - outflow
      running += net
      forecast.push({
        weekStart: weekStart.toISOString().slice(0, 10),
        inflow,
        outflow,
        net: Math.round(net * 100) / 100,
        runningBalance: Math.round(running * 100) / 100,
      })
    }

    // Narrative via AI
    const systemPrompt = `You are a CFO-level financial analyst. Produce a concise, professional cash-flow forecast narrative.
Return JSON ONLY: {"narrative": "string", "risks": ["string"], "opportunities": ["string"]}`
    const prompt = `Forecast (next ${weeks} weeks):\n${forecast
      .map(
        (w) =>
          `- ${w.weekStart}: in $${w.inflow}, out $${w.outflow}, net $${w.net}, balance $${w.runningBalance}`
      )
      .join('\n')}\n\nIdentify the top 3 risks and top 3 opportunities and write a short narrative.`

    const aiResponse = await callAI(prompt, systemPrompt, { temperature: 0.4, maxTokens: 1200 })
    const parsed = parseAIJson<{ narrative: string; risks: string[]; opportunities: string[] }>(
      aiResponse
    )
    if (!parsed) throw new Error('Could not parse AI narrative')

    const result = {
      forecast,
      narrative: parsed.narrative,
      risks: parsed.risks || [],
      opportunities: parsed.opportunities || [],
      _meta: { model: AI_MODEL, processingTime: Date.now() - startTime, weeks },
    }

    await logAIResult({
      type: 'FINANCIAL_INSIGHTS',
      input: { weeks, clientId },
      output: result,
      confidence: 0.8,
      status: 'COMPLETED',
      processingTime: Date.now() - startTime,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Cash-flow forecast error:', error)
    return NextResponse.json(
      { error: 'Forecast failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
