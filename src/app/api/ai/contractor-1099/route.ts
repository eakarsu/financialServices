/**
 * AI 1099 / Contractor Packet Generator
 *
 * Pulls contractor (non-employee) payments and generates an IRS 1099-NEC
 * draft per contractor. AI normalizes recipient address + box-mapping notes.
 *
 * Body: { taxYear?: number; contractorId?: string }
 * Returns: { contractors: ContractorPacket[] }
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

interface ContractorPacket {
  contractorId: string
  name: string
  totalPaid: number
  taxYear: number
  formType: '1099-NEC' | '1099-MISC'
  boxes: Record<string, number | string | null>
  notes: string[]
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
    const taxYear: number = body.taxYear ?? new Date().getFullYear() - 1
    const contractorId: string | undefined = body.contractorId

    const yearStart = new Date(`${taxYear}-01-01`)
    const yearEnd = new Date(`${taxYear + 1}-01-01`)

    // Treat clients flagged as contractors (or all clients if not flagged) as packet candidates
    const contractors = await prisma.client.findMany({
      where: {
        firmId: user.firmId,
        ...(contractorId ? { id: contractorId } : {}),
      },
      take: 200,
      select: { id: true, businessName: true, firstName: true, lastName: true, email: true },
    })

    const packets: ContractorPacket[] = []
    for (const c of contractors) {
      const paymentsAgg = await prisma.transaction.aggregate({
        where: {
          client: { firmId: user.firmId },
          clientId: c.id,
          date: { gte: yearStart, lt: yearEnd },
          type: 'DEBIT', // outflow / expense
        },
        _sum: { amount: true },
      })
      const totalPaid = Math.abs(Number(paymentsAgg._sum?.amount || 0))
      if (totalPaid < 600) continue // 1099-NEC threshold

      const name =
        c.businessName ||
        [c.firstName, c.lastName].filter(Boolean).join(' ') ||
        c.email ||
        'Unknown'

      // Optional AI assist for box mapping notes
      let notes: string[] = []
      try {
        const sys = `You are a 1099 preparation expert. Given a contractor name and total paid, advise box mapping for IRS 1099-NEC.
Return JSON ONLY: {"notes": ["string"]}`
        const usr = `Contractor: ${name}\nTax year: ${taxYear}\nTotal paid: $${totalPaid}`
        const resp = await callAI(usr, sys, { temperature: 0.2, maxTokens: 400 })
        const parsed = parseAIJson<{ notes: string[] }>(resp)
        if (parsed?.notes) notes = parsed.notes
      } catch (e) {
        notes = [`AI box-mapping unavailable: ${(e as Error).message}`]
      }

      packets.push({
        contractorId: c.id,
        name,
        totalPaid: Math.round(totalPaid * 100) / 100,
        taxYear,
        formType: '1099-NEC',
        boxes: {
          box1_NonemployeeCompensation: Math.round(totalPaid * 100) / 100,
          box4_FederalTaxWithheld: 0,
          box5_StateTaxWithheld: 0,
        },
        notes,
      })
    }

    const result = {
      contractors: packets,
      taxYear,
      generated: packets.length,
      _meta: { model: AI_MODEL, processingTime: Date.now() - startTime },
    }

    await logAIResult({
      type: 'TAX_DEDUCTION_FINDER',
      input: { taxYear, contractorId },
      output: result,
      confidence: 0.85,
      status: 'COMPLETED',
      processingTime: Date.now() - startTime,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('1099 generator error:', error)
    return NextResponse.json(
      { error: 'Generation failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
