/**
 * AI Reconciliation Copilot
 *
 * Surfaces unreconciled bank transactions and uses Claude to suggest matches
 * between bank feed and journal entries. Returns ranked candidate matches per
 * unreconciled bank transaction.
 *
 * Body: { bankAccountId?: string; unreconciledTransactionIds?: string[]; limit?: number }
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

interface MatchSuggestion {
  bankTxId: string
  candidates: Array<{
    journalLineId: string
    confidence: number
    reason: string
  }>
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
    const limit = Math.min(50, Math.max(1, body.limit ?? 20))

    // Pull unreconciled bank transactions for this firm
    const bankTxns = await prisma.transaction.findMany({
      where: {
        client: { firmId: user.firmId },
        ...(body.bankAccountId ? { bankAccountId: body.bankAccountId } : {}),
        ...(Array.isArray(body.unreconciledTransactionIds) && body.unreconciledTransactionIds.length
          ? { id: { in: body.unreconciledTransactionIds } }
          : { isReconciled: false }),
      },
      take: limit,
      orderBy: { date: 'desc' },
      select: { id: true, amount: true, description: true, date: true },
    })

    // Pull recent journal lines as candidate match pool (scoped via journal entry → client → firm)
    const journalLines = await prisma.journalLine.findMany({
      where: {
        journalEntry: { client: { firmId: user.firmId } },
      },
      take: 200,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        description: true,
        debit: true,
        credit: true,
        journalEntryId: true,
      },
    })

    if (bankTxns.length === 0) {
      return NextResponse.json({ matches: [], message: 'No unreconciled bank transactions found' })
    }

    const systemPrompt = `You are an expert bookkeeper. Match bank transactions to journal lines.
For each bank transaction, return up to 3 candidate journal lines ranked by confidence (0-1).
Match on: amount, date proximity, and description similarity.
Return JSON: {"matches": [{"bankTxId": "string", "candidates": [{"journalLineId": "string", "confidence": number, "reason": "string"}]}]}`

    const prompt = `Bank transactions:
${bankTxns.map((b) => `${b.id}: $${b.amount} on ${b.date.toISOString().slice(0, 10)} — ${b.description}`).join('\n')}

Journal lines (candidate pool):
${journalLines
  .map(
    (l) =>
      `${l.id}: dr $${l.debit ?? 0} cr $${l.credit ?? 0} (entry ${l.journalEntryId}) — ${l.description ?? ''}`
  )
  .join('\n')}`

    const aiResponse = await callAI(prompt, systemPrompt, { temperature: 0.2, maxTokens: 2000 })
    const parsed = parseAIJson<{ matches: MatchSuggestion[] }>(aiResponse)
    if (!parsed) throw new Error('Could not parse AI matches')

    const result = {
      matches: parsed.matches || [],
      counts: {
        bankTxns: bankTxns.length,
        candidates: journalLines.length,
        suggestions: parsed.matches?.length || 0,
      },
      _meta: { model: AI_MODEL, processingTime: Date.now() - startTime },
    }

    await logAIResult({
      type: 'BANK_RECONCILIATION',
      input: { bankCount: bankTxns.length, jlCount: journalLines.length },
      output: result,
      confidence: 0.75,
      status: 'COMPLETED',
      processingTime: Date.now() - startTime,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Reconciliation copilot error:', error)
    return NextResponse.json(
      { error: 'Reconciliation failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
