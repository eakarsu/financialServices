import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from './prisma'
import { getCurrentUser } from './auth'
import { requestWorkflowReadiness } from './openrouter'
import { AdvisoryError, execution } from './advisory-execution'

export function createReadinessAdvice({ db = prisma, actor = getCurrentUser, provider = requestWorkflowReadiness } = {}) {
  async function GET() {
    const user = await actor()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const rows = await db.aIAnalysis.findMany({ where: { type: 'AUDIT_PREPARATION', status: 'COMPLETED', AND: [{ input: { path: ['requestedByUserId'], equals: user.id } }, { input: { path: ['firmId'], equals: user.firmId ?? Prisma.JsonNull } }] }, orderBy: { createdAt: 'desc' }, take: 50 })
    const reports = rows.flatMap(row => { const input = row.input as { workflow?: string }, output = row.output as { result?: string; providerReceipt?: { model?: string } }; return typeof output?.result === 'string' ? [{ id: row.id, prompt: input.workflow || '', content: output.result, model: output.providerReceipt?.model || 'Recorded provider model', createdAt: row.createdAt }] : [] })
    return NextResponse.json({ reports })
  }
  async function POST(request: NextRequest) {
    const job = execution(request.signal)
    try {
      const user = await actor()
      if (!user) throw new AdvisoryError('Not authenticated', 401)
      job.check()
      const body = await request.json().catch(() => ({}))
      const workflow = typeof body?.workflow === 'string' ? body.workflow.trim() : ''
      if (workflow.length < 10 || workflow.length > 1000) throw new AdvisoryError('workflow must contain 10-1000 characters', 400)
      const evidence = await provider(workflow, job.signal)
      job.check()
      const analysis = await db.$transaction(async tx => {
        const fresh = await tx.user.findUnique({ where: { id: user.id }, select: { id: true, isActive: true, firmId: true } })
        if (!fresh?.isActive || fresh.firmId !== user.firmId) throw new AdvisoryError('Your active firm membership changed. Sign in again.', 401)
        job.check()
        const row = await tx.aIAnalysis.create({ data: { type: 'AUDIT_PREPARATION', status: 'COMPLETED', input: { workflow, requestedByUserId: user.id, firmId: user.firmId }, output: { result: evidence.result, providerReceipt: evidence.receipt } }, select: { id: true, createdAt: true } })
        job.check(); return row
      })
      return NextResponse.json({ analysisId: analysis.id, createdAt: analysis.createdAt, result: evidence.result, providerReceipt: evidence.receipt })
    } catch (error) {
      const failure = job.signal.aborted ? job.signal.reason : error
      return NextResponse.json({ error: failure instanceof AdvisoryError ? failure.message : 'AI provider request failed' }, { status: failure instanceof AdvisoryError ? failure.status : 502 })
    } finally { job.close() }
  }
  return { GET, POST }
}
