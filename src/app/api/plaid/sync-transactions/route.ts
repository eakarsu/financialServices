import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { syncTransactions } from '@/lib/plaid'
import prisma from '@/lib/prisma'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'

// ---------- AI helper utilities (self-contained so the sync route has no import cycle) ----------

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
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages, temperature: 0.7, max_tokens: 2000 }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter API error: ${err}`)
  }

  const data = await response.json()
  return extractJSON(data.choices[0]?.message?.content || '')
}

// Auto-detect anomalies in a batch of new transactions
async function runAnomalyDetection(
  transactions: Array<{ id: string; amount: number; description: string; date: string }>
): Promise<Array<{ transactionId: string; reason: string; severity: string }>> {
  if (transactions.length === 0) return []

  const systemPrompt = `You are a financial anomaly detection expert. Analyze transactions for unusual patterns, potential fraud, or errors.
Return JSON array only: [{"transactionId": "id", "reason": "explanation", "severity": "HIGH|MEDIUM|LOW"}]
If no anomalies found, return an empty array [].`

  const transactionList = transactions
    .map((t) => `ID: ${t.id}, Amount: $${t.amount}, Description: ${t.description}, Date: ${t.date}`)
    .join('\n')

  const prompt = `Analyze these newly synced transactions for anomalies:\n${transactionList}\n\nLook for:\n- Unusually large or small amounts\n- Duplicate transactions\n- Suspicious descriptions\n- Weekend/holiday transactions\n- Round number patterns`

  try {
    const response = await callOpenRouter(prompt, systemPrompt)
    return JSON.parse(response)
  } catch (error) {
    console.error('Auto anomaly detection parse error:', error)
    return []
  }
}

// Auto-find deductions in a batch of new transactions
async function runDeductionFinder(
  transactions: Array<{ category: string; amount: number; description: string }>
): Promise<Array<{ category: string; amount: number; description: string; taxCode: string }>> {
  if (transactions.length === 0) return []

  const systemPrompt = `You are a tax deduction expert for businesses. Identify tax-deductible expenses.
Return JSON array only: [{"category": "string", "amount": number, "description": "string", "taxCode": "IRS code reference"}]
If no deductions found, return an empty array [].`

  const summary = transactions.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = 0
    acc[t.category] += t.amount
    return acc
  }, {} as Record<string, number>)

  const prompt = `Analyze these newly synced expense categories for potential tax deductions:\n${Object.entries(summary)
    .map(([cat, amt]) => `${cat}: $${amt}`)
    .join('\n')}`

  try {
    const response = await callOpenRouter(prompt, systemPrompt)
    return JSON.parse(response)
  } catch (error) {
    console.error('Auto deduction finder parse error:', error)
    return []
  }
}

// ---------- Main route handler ----------

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bankAccountId } = await request.json()

    // Get bank account with Plaid credentials
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: { client: true },
    })

    if (!bankAccount || !bankAccount.plaidAccessToken) {
      return NextResponse.json(
        { error: 'Bank account not found or not connected' },
        { status: 404 }
      )
    }

    // Sync transactions from Plaid
    const result = await syncTransactions(bankAccount.plaidAccessToken)

    // Persist added transactions and collect them for AI processing
    const newTransactionIds: string[] = []
    for (const tx of result.added) {
      const created = await prisma.transaction.create({
        data: {
          clientId: bankAccount.clientId,
          bankAccountId: bankAccount.id,
          date: new Date(tx.date),
          description: tx.name,
          amount: Math.abs(tx.amount),
          type: tx.amount > 0 ? 'CREDIT' : 'DEBIT',
          status: 'PENDING',
          vendor: tx.merchant_name || undefined,
          originalDescription: tx.original_description || undefined,
        },
      })
      newTransactionIds.push(created.id)
    }

    // Update bank account sync timestamp
    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { lastSyncedAt: new Date() },
    })

    // -----------------------------------------------------------------------
    // AUTO-TRIGGER AI on newly imported transactions (non-blocking, best-effort)
    // -----------------------------------------------------------------------
    let anomaliesDetected = 0
    let deductionsFlagged = 0

    if (newTransactionIds.length > 0) {
      // Fetch the persisted records so we have real IDs
      const newTransactions = await prisma.transaction.findMany({
        where: { id: { in: newTransactionIds } },
        select: {
          id: true,
          amount: true,
          description: true,
          date: true,
          type: true,
          vendor: true,
        },
      })

      // 1. Anomaly detection
      try {
        const anomalyInput = newTransactions.map((t) => ({
          id: t.id,
          amount: parseFloat(t.amount.toString()),
          description: t.description,
          date: t.date.toISOString().split('T')[0],
        }))

        const anomalies = await runAnomalyDetection(anomalyInput)
        anomaliesDetected = anomalies.length

        if (anomalies.length > 0) {
          // Store the result in AIAnalysis for review
          await prisma.aIAnalysis.create({
            data: {
              type: 'ANOMALY_DETECTION',
              input: { bankAccountId, transactionCount: newTransactions.length } as never,
              output: { anomalies } as never,
              confidence: 0.85,
              status: 'COMPLETED',
            },
          })

          // Also surface high/medium severity as AIInsights
          const highSeverity = anomalies.filter((a) =>
            ['HIGH', 'MEDIUM'].includes(a.severity.toUpperCase())
          )
          if (highSeverity.length > 0) {
            await prisma.aIInsight.createMany({
              data: highSeverity.map((a) => ({
                category: 'ANOMALY',
                title: `Suspicious transaction detected`,
                description: `Transaction ${a.transactionId}: ${a.reason}`,
                severity:
                  a.severity.toUpperCase() === 'HIGH' ? 'CRITICAL' : 'WARNING',
                data: a as never,
              })),
            })
          }
        }
      } catch (anomalyError) {
        console.error('Auto anomaly detection failed (non-fatal):', anomalyError)
      }

      // 2. Deduction finder — only DEBIT transactions are potential deductions
      try {
        const debitTransactions = newTransactions
          .filter((t) => t.type === 'DEBIT')
          .map((t) => ({
            category: 'Uncategorized',
            amount: parseFloat(t.amount.toString()),
            description: t.description,
          }))

        if (debitTransactions.length > 0) {
          const deductions = await runDeductionFinder(debitTransactions)
          deductionsFlagged = deductions.length

          if (deductions.length > 0) {
            await prisma.aIAnalysis.create({
              data: {
                type: 'TAX_DEDUCTION_FINDER',
                input: { bankAccountId, transactionCount: debitTransactions.length } as never,
                output: { deductions } as never,
                confidence: 0.8,
                status: 'COMPLETED',
              },
            })

            // Surface as opportunities
            await prisma.aIInsight.createMany({
              data: deductions.slice(0, 5).map((d) => ({
                category: 'DEDUCTION',
                title: `Potential tax deduction: ${d.category}`,
                description: `$${d.amount.toFixed(2)} in ${d.category} may be deductible (${d.taxCode}). ${d.description}`,
                severity: 'OPPORTUNITY' as const,
                data: d as never,
              })),
            })
          }
        }
      } catch (deductionError) {
        console.error('Auto deduction finder failed (non-fatal):', deductionError)
      }
    }

    return NextResponse.json({
      added: result.added.length,
      modified: result.modified.length,
      removed: result.removed.length,
      hasMore: result.hasMore,
      ai: {
        anomaliesDetected,
        deductionsFlagged,
      },
    })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json({ error: 'Failed to sync transactions' }, { status: 500 })
  }
}
