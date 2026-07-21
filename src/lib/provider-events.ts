import type { User } from '@prisma/client'
import prisma from './prisma'
import { appendAuditEventTx } from './audit'
import type { ProviderEvidence } from './providers/document-provider'

interface EventContext {
  requestId: string
  ipAddress?: string | null
  userAgent?: string | null
}

export async function recordProviderEvent(input: {
  firmId: string
  actor: Pick<User, 'id'>
  versionId: string
  operation: string
  evidence: ProviderEvidence
  context: EventContext
}) {
  const existing = await prisma.documentProcessingEvent.findUnique({
    where: { provider_providerEventId: { provider: input.evidence.provider, providerEventId: input.evidence.eventId } },
  })
  if (existing) {
    if (existing.payloadDigest !== input.evidence.payloadDigest || existing.documentVersionId !== input.versionId) {
      throw new Error('Provider event identity was reused with different evidence')
    }
    return existing
  }

  return prisma.$transaction(async (tx) => {
    const event = await tx.documentProcessingEvent.create({
      data: {
        documentVersionId: input.versionId,
        requestedById: input.actor.id,
        operation: input.operation,
        provider: input.evidence.provider,
        providerEventId: input.evidence.eventId,
        sourceTimestamp: input.evidence.sourceTimestamp,
        sourceSha256: input.evidence.sourceSha256,
        payloadDigest: input.evidence.payloadDigest,
        status: input.evidence.status,
        result: input.evidence.result as never,
      },
    })
    await appendAuditEventTx(tx, {
      firmId: input.firmId, actorId: input.actor.id, requestId: input.context.requestId,
      action: 'PROVIDER_EVENT', entityType: 'DocumentProcessingEvent', entityId: event.id,
      newValue: {
        operation: event.operation, provider: event.provider, providerEventId: event.providerEventId,
        sourceTimestamp: event.sourceTimestamp, sourceSha256: event.sourceSha256, status: event.status,
      },
      ipAddress: input.context.ipAddress, userAgent: input.context.userAgent,
    })
    return event
  })
}
