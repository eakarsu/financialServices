import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requestWorkflowReadiness } from '@/lib/openrouter'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({})) as { workflow?: unknown }
    const workflow = typeof body.workflow === 'string' ? body.workflow.trim() : ''
    if (workflow.length < 10 || workflow.length > 1_000) {
      return NextResponse.json({ error: 'workflow must contain 10-1000 characters' }, { status: 400 })
    }

    const evidence = await requestWorkflowReadiness(workflow)
    const analysis = await prisma.aIAnalysis.create({
      data: {
        type: 'AUDIT_PREPARATION',
        status: 'COMPLETED',
        input: { workflow, requestedByUserId: user.id, firmId: user.firmId },
        output: { result: evidence.result, providerReceipt: evidence.receipt },
      },
      select: { id: true, createdAt: true },
    })

    return NextResponse.json({
      analysisId: analysis.id,
      createdAt: analysis.createdAt,
      result: evidence.result,
      providerReceipt: evidence.receipt,
    })
  } catch (error) {
    console.error('Legal workflow readiness error:', error)
    return NextResponse.json({ error: 'AI provider request failed' }, { status: 502 })
  }
}
