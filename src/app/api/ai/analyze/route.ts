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

async function categorizeTransaction(description: string, amount: number): Promise<{ category: string; confidence: number; explanation: string }> {
  const systemPrompt = `You are a financial categorization expert for accounting firms. Analyze transactions and categorize them accurately.
Return JSON format only: {"category": "string", "confidence": number between 0-1, "explanation": "brief reason"}`

  const prompt = `Categorize this transaction:
Description: ${description}
Amount: $${amount}

Categories to choose from:
- Office Supplies
- Utilities
- Rent
- Travel
- Meals & Entertainment
- Software & Subscriptions
- Professional Services
- Insurance
- Payroll
- Advertising & Marketing
- Equipment
- Repairs & Maintenance
- Bank Fees
- Interest Expense
- Other Expenses`

  const response = await callAI(prompt, systemPrompt)
  const parsed = parseAIJson<{ category?: string; confidence?: number; explanation?: string }>(response)
  if (!parsed) throw new Error('AI response could not be parsed for categorization')
  return {
    category: parsed.category || 'Other Expenses',
    confidence: parsed.confidence ?? 0.8,
    explanation: parsed.explanation || 'Categorized by AI',
  }
}

async function detectAnomalies(transactions: Array<{ id: string; amount: number; description: string; date: string }>): Promise<Array<{ transactionId: string; reason: string; severity: string }>> {
  const systemPrompt = `You are a financial anomaly detection expert. Analyze transactions for unusual patterns, potential fraud, or errors.
Return JSON array: [{"transactionId": "id", "reason": "explanation", "severity": "HIGH|MEDIUM|LOW"}]`

  const transactionList = transactions
    .map((t) => `ID: ${t.id}, Amount: $${t.amount}, Description: ${t.description}, Date: ${t.date}`)
    .join('\n')

  const prompt = `Analyze these transactions for anomalies:
${transactionList}

Look for:
- Unusually large or small amounts
- Duplicate transactions
- Suspicious descriptions
- Weekend/holiday transactions
- Round number patterns`

  const response = await callAI(prompt, systemPrompt)
  const parsed = parseAIJson<Array<{ transactionId: string; reason: string; severity: string }>>(response)
  if (!parsed) throw new Error('AI response could not be parsed for anomaly detection')
  return parsed
}

async function findDeductions(transactions: Array<{ category: string; amount: number; description: string }>): Promise<Array<{ category: string; amount: number; description: string; taxCode: string }>> {
  const systemPrompt = `You are a tax deduction expert for businesses. Identify tax-deductible expenses and categorize them properly.
Return JSON array: [{"category": "string", "amount": number, "description": "string", "taxCode": "IRS code reference"}]`

  const transactionSummary = transactions.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = 0
    acc[t.category] += t.amount
    return acc
  }, {} as Record<string, number>)

  const prompt = `Analyze these expense categories for potential tax deductions:
${Object.entries(transactionSummary).map(([cat, amt]) => `${cat}: $${amt}`).join('\n')}

Identify:
- Fully deductible expenses
- Partially deductible expenses (with percentage)
- Business expense deductions
- Home office deductions if applicable`

  const response = await callAI(prompt, systemPrompt)
  const parsed = parseAIJson<Array<{ category: string; amount: number; description: string; taxCode: string }>>(response)
  if (!parsed) throw new Error('AI response could not be parsed for deductions')
  return parsed
}

async function generateInsights(data: { revenue: number; expenses: number; profit: number; period: string }): Promise<Array<{ title: string; description: string; severity: string; recommendation?: string }>> {
  const systemPrompt = `You are a financial analyst providing insights for accounting firms. Analyze financial data and provide actionable insights.
Return JSON array: [{"title": "string", "description": "string", "severity": "INFO|WARNING|OPPORTUNITY|CRITICAL", "recommendation": "optional action"}]`

  const prompt = `Analyze these financial metrics for ${data.period}:
Revenue: $${data.revenue}
Expenses: $${data.expenses}
Profit: $${data.profit}
Profit Margin: ${((data.profit / data.revenue) * 100).toFixed(1)}%

Provide 3-5 key insights about:
- Financial health
- Spending patterns
- Growth opportunities
- Risk factors`

  const response = await callAI(prompt, systemPrompt)
  const parsed = parseAIJson<Array<{ title: string; description: string; severity: string; recommendation?: string }>>(response)
  if (!parsed) throw new Error('AI response could not be parsed for insights')
  return parsed
}

async function draftEmail(data: { clientName: string; topic: string; context: string; tone?: string }): Promise<{ subject: string; body: string }> {
  const systemPrompt = `You are a professional communication assistant for accounting firms. Draft clear, professional emails.
Return JSON: {"subject": "string", "body": "string"}`

  const prompt = `Draft a professional email:
Client: ${data.clientName}
Topic: ${data.topic}
Context: ${data.context}
Tone: ${data.tone || 'professional and friendly'}

Include:
- Appropriate greeting
- Clear purpose
- Relevant details
- Call to action if needed
- Professional closing`

  const response = await callAI(prompt, systemPrompt)
  const parsed = parseAIJson<{ subject: string; body: string }>(response)
  if (!parsed) throw new Error('AI response could not be parsed for email draft')
  return parsed
}

async function processReceipt(data: { text: string; imageDescription?: string }): Promise<{ vendor: string; amount: number; date: string; category: string; items: Array<{ description: string; amount: number }> }> {
  const systemPrompt = `You are a receipt processing expert. Extract structured data from receipt text.
Return JSON: {"vendor": "string", "amount": number, "date": "YYYY-MM-DD", "category": "string", "items": [{"description": "string", "amount": number}]}`

  const prompt = `Extract receipt information:
${data.text}
${data.imageDescription ? `\nImage description: ${data.imageDescription}` : ''}

Extract:
- Vendor/store name
- Total amount
- Date
- Category of purchase
- Individual line items if visible`

  const response = await callAI(prompt, systemPrompt)
  const parsed = parseAIJson<{ vendor: string; amount: number; date: string; category: string; items: Array<{ description: string; amount: number }> }>(response)
  if (!parsed) throw new Error('AI response could not be parsed for receipt')
  return parsed
}

async function researchTax(query: string): Promise<{ answer: string; sources: string[]; confidence: number }> {
  const systemPrompt = `You are a tax research expert with deep knowledge of US tax law. Provide accurate, helpful information.
Return JSON: {"answer": "detailed answer", "sources": ["relevant IRS codes/publications"], "confidence": number 0-1}`

  const prompt = `Tax research query: ${query}

Provide:
- Clear, accurate answer
- Relevant IRS code references
- Any important caveats or exceptions
- Practical implications`

  const response = await callAI(prompt, systemPrompt)
  const parsed = parseAIJson<{ answer: string; sources: string[]; confidence: number }>(response)
  if (!parsed) throw new Error('AI response could not be parsed for tax research')
  return parsed
}

// Map frontend types to database enum values
function mapTypeToEnum(type: string): string {
  const mapping: Record<string, string> = {
    'CATEGORIZE_TRANSACTION': 'TRANSACTION_CATEGORIZATION',
    'DETECT_ANOMALIES': 'ANOMALY_DETECTION',
    'FIND_DEDUCTIONS': 'TAX_DEDUCTION_FINDER',
    'GENERATE_INSIGHTS': 'FINANCIAL_INSIGHTS',
    'DRAFT_EMAIL': 'CLIENT_COMMUNICATION',
    'PROCESS_RECEIPT': 'RECEIPT_PROCESSING',
    'TAX_RESEARCH': 'TAX_RESEARCH',
    'RECONCILE_BANK': 'BANK_RECONCILIATION',
  }
  return mapping[type] || type
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let requestType = ''
  let requestData: Record<string, unknown> = {}

  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Per-user rate limiter: 20 AI calls per hour
    const rl = aiRateLimiter(user.id)
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: 'AI rate limit exceeded',
          message: `Try again in ${Math.ceil(rl.resetIn / 60000)} minute(s)`,
          remaining: rl.remaining,
          resetIn: rl.resetIn,
        },
        { status: 429 }
      )
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured', message: 'OPENROUTER_API_KEY missing' },
        { status: 503 }
      )
    }

    const body = await request.json()
    requestType = body.type
    requestData = body.data

    let result: Record<string, unknown> = {}
    let confidence = 0.85

    switch (requestType) {
      case 'CATEGORIZE_TRANSACTION': {
        const catResult = await categorizeTransaction(requestData.description as string, (requestData.amount as number) || 0)
        result = catResult
        confidence = catResult.confidence
        break
      }

      case 'DETECT_ANOMALIES': {
        const anomalies = await detectAnomalies((requestData.transactions as Array<{ id: string; amount: number; description: string; date: string }>) || [])
        result = { anomalies }
        break
      }

      case 'FIND_DEDUCTIONS': {
        const deductions = await findDeductions((requestData.transactions as Array<{ category: string; amount: number; description: string }>) || [])
        result = { deductions }
        break
      }

      case 'GENERATE_INSIGHTS': {
        const insights = await generateInsights(requestData as { revenue: number; expenses: number; profit: number; period: string })
        result = { insights }
        break
      }

      case 'DRAFT_EMAIL':
        result = await draftEmail(requestData as { clientName: string; topic: string; context: string; tone?: string })
        break

      case 'PROCESS_RECEIPT':
        result = await processReceipt(requestData as { text: string; imageDescription?: string })
        break

      case 'TAX_RESEARCH': {
        const research = await researchTax(requestData.query as string)
        result = research
        confidence = research.confidence
        break
      }

      case 'RECONCILE_BANK': {
        // Bank reconciliation logic (deterministic, no AI required)
        const { bankTransactions, bookTransactions } = requestData
        const matches: Array<{ bankId: string; bookId: string; confidence: number }> = []
        const unmatched = { bank: [] as string[], book: [] as string[] }

        for (const bankTx of (bankTransactions as Array<{ id: string; amount: number; description: string }>) || []) {
          let bestMatch = null
          let bestConfidence = 0

          for (const bookTx of (bookTransactions as Array<{ id: string; amount: number; description: string }>) || []) {
            if (Math.abs(bankTx.amount - bookTx.amount) < 0.01) {
              const conf = bankTx.description.toLowerCase().includes(bookTx.description.toLowerCase().slice(0, 10)) ? 0.95 : 0.8
              if (conf > bestConfidence) {
                bestConfidence = conf
                bestMatch = bookTx.id
              }
            }
          }

          if (bestMatch && bestConfidence > 0.7) {
            matches.push({ bankId: bankTx.id, bookId: bestMatch, confidence: bestConfidence })
          } else {
            unmatched.bank.push(bankTx.id)
          }
        }

        result = { matches, unmatched, reconciled: matches.length, pending: unmatched.bank.length + unmatched.book.length }
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown analysis type' }, { status: 400 })
    }

    const processingTime = Date.now() - startTime

    await logAIResult({
      type: mapTypeToEnum(requestType),
      input: requestData,
      output: result,
      confidence,
      status: 'COMPLETED',
      processingTime,
    })

    return NextResponse.json({
      ...result,
      _meta: { model: AI_MODEL, processingTime, rateLimit: { remaining: rl.remaining, resetIn: rl.resetIn } },
    })
  } catch (error) {
    console.error('AI analysis error:', error)

    await logAIResult({
      type: mapTypeToEnum(requestType),
      input: requestData,
      output: { error: error instanceof Error ? error.message : 'Unknown error' },
      confidence: 0,
      status: 'FAILED',
      processingTime: Date.now() - startTime,
    })

    return NextResponse.json(
      {
        error: 'AI analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
