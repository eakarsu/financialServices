import { createHash, randomUUID } from 'crypto'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { appendAuditEventTx, canonicalJson } from '@/lib/audit'
import { requireSecret } from '@/lib/secrets'
import { validSignatureTransition, verifyProviderWebhook } from '@/lib/providers/document-provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const webhookSchema = z.object({
  provider: z.string().min(1).max(100),
  eventId: z.string().min(1).max(255),
  envelopeId: z.string().min(1).max(255),
  signerEmail: z.string().email().transform((value) => value.toLowerCase()),
  status: z.enum(['PENDING', 'VIEWED', 'SIGNED', 'DECLINED', 'FAILED']),
  occurredAt: z.string().datetime(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  ipAddress: z.string().max(100).optional(),
  failureCode: z.string().max(100).optional(),
  failureReason: z.string().max(1000).optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('x-esignature-signature') || ''
  if (!verifyProviderWebhook(rawBody, signatureHeader, requireSecret('ESIGNATURE_WEBHOOK_SECRET'))) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }
  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }
  const parsed = webhookSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const event = parsed.data
  const payloadDigest = createHash('sha256').update(canonicalJson(event)).digest('hex')
  try {
    const existing = await prisma.documentProcessingEvent.findUnique({
      where: { provider_providerEventId: { provider: event.provider, providerEventId: event.eventId } },
    })
    if (existing) {
      if (existing.payloadDigest !== payloadDigest) return NextResponse.json({ error: 'Altered provider event replay' }, { status: 409 })
      return NextResponse.json({ received: true, replay: true })
    }
    const signature = await prisma.documentSignature.findUnique({
      where: { provider_providerEnvelopeId_signerEmail: { provider: event.provider, providerEnvelopeId: event.envelopeId, signerEmail: event.signerEmail } },
      include: { document: true, documentVersion: true },
    })
    if (!signature) return NextResponse.json({ error: 'Signature envelope not found' }, { status: 404 })
    if (signature.documentVersion.contentSha256 !== event.sourceSha256) {
      return NextResponse.json({ error: 'Signed source checksum does not match the requested version' }, { status: 409 })
    }
    if (!validSignatureTransition(signature.status, event.status)) {
      return NextResponse.json({ error: `Invalid signature transition ${signature.status} -> ${event.status}` }, { status: 409 })
    }
    await prisma.$transaction(async (tx) => {
      await tx.documentProcessingEvent.create({
        data: {
          documentVersionId: signature.documentVersionId, requestedById: signature.requestedById,
          operation: 'E_SIGNATURE_EVENT', provider: event.provider, providerEventId: event.eventId,
          sourceTimestamp: new Date(event.occurredAt), sourceSha256: event.sourceSha256,
          payloadDigest, status: event.status, result: event as never,
        },
      })
      await tx.documentSignature.update({
        where: { id: signature.id },
        data: {
          status: event.status, providerEventId: event.eventId, providerPayloadDigest: payloadDigest,
          signedAt: event.status === 'SIGNED' ? new Date(event.occurredAt) : null,
          ipAddress: event.ipAddress, failureCode: event.failureCode, failureReason: event.failureReason,
          evidence: event.evidence as never,
        },
      })
      if (event.status === 'SIGNED' && signature.document.version === signature.documentVersion.version) {
        const incomplete = await tx.documentSignature.count({
          where: { documentVersionId: signature.documentVersionId, id: { not: signature.id }, status: { not: 'SIGNED' } },
        })
        if (incomplete === 0) await tx.document.update({ where: { id: signature.documentId }, data: { status: 'SIGNED' } })
      }
      await appendAuditEventTx(tx, {
        firmId: signature.document.firmId, actorId: null, requestId: request.headers.get('x-request-id') || randomUUID(),
        action: 'SIGNATURE_EVENT', entityType: 'DocumentSignature', entityId: signature.id,
        oldValue: { status: signature.status },
        newValue: { status: event.status, provider: event.provider, eventId: event.eventId, occurredAt: event.occurredAt, failureCode: event.failureCode },
        ipAddress: request.headers.get('x-forwarded-for'), userAgent: request.headers.get('user-agent'),
      })
    })
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('E-signature webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
