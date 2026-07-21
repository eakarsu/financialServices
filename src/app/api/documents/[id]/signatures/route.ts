import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { sha256 } from '@/lib/documents'
import { getFile } from '@/lib/storage'
import { callDocumentProvider } from '@/lib/providers/document-provider'
import { requestContext } from '@/lib/request-context'

const requestSchema = z.object({
  signerName: z.string().min(1).max(200),
  signerEmail: z.string().email().transform((value) => value.toLowerCase()),
})

const providerResultSchema = z.object({
  envelopeId: z.string().min(1).max(255),
  signingUrl: z.string().url().optional(),
  expiresAt: z.string().datetime(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const document = await getDocumentForAccess(id, user, 'MANAGE')
    if (document.reviewStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Only an independently approved document can be sent for signature' }, { status: 409 })
    }
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    const version = await prisma.documentVersion.findUniqueOrThrow({
      where: { documentId_version: { documentId: id, version: document.version } },
    })
    if (version.reviewStatus !== 'APPROVED') return NextResponse.json({ error: 'Current version is not approved' }, { status: 409 })
    const content = await getFile(version.storageKey)
    if (sha256(content) !== version.contentSha256) throw new Error('Stored document checksum does not match provenance')
    const evidence = await callDocumentProvider({
      operation: 'esignature', sourceSha256: version.contentSha256, content,
      metadata: { documentId: id, version: version.version, ...parsed.data },
    })
    const providerResult = providerResultSchema.parse(evidence.result)
    const context = requestContext(request)
    const signature = await prisma.$transaction(async (tx) => {
      const existingEvent = await tx.documentProcessingEvent.findUnique({
        where: { provider_providerEventId: { provider: evidence.provider, providerEventId: evidence.eventId } },
      })
      if (existingEvent) {
        if (existingEvent.payloadDigest !== evidence.payloadDigest || existingEvent.documentVersionId !== version.id) {
          throw new Error('Provider event identity was reused with different evidence')
        }
        return tx.documentSignature.findUniqueOrThrow({
          where: { provider_providerEnvelopeId_signerEmail: { provider: evidence.provider, providerEnvelopeId: providerResult.envelopeId, signerEmail: parsed.data.signerEmail } },
        })
      }
      const created = await tx.documentSignature.create({
        data: {
          documentId: id, documentVersionId: version.id, requestedById: user.id,
          signerName: parsed.data.signerName, signerEmail: parsed.data.signerEmail,
          provider: evidence.provider, providerEnvelopeId: providerResult.envelopeId,
          providerEventId: evidence.eventId, providerPayloadDigest: evidence.payloadDigest,
          expiresAt: new Date(providerResult.expiresAt), status: evidence.status === 'FAILED' ? 'FAILED' : 'PENDING',
          evidence: { sourceTimestamp: evidence.sourceTimestamp.toISOString(), sourceSha256: evidence.sourceSha256 },
        },
      })
      await tx.documentProcessingEvent.create({
        data: {
          documentVersionId: version.id, requestedById: user.id, operation: 'E_SIGNATURE_REQUEST',
          provider: evidence.provider, providerEventId: evidence.eventId, sourceTimestamp: evidence.sourceTimestamp,
          sourceSha256: evidence.sourceSha256, payloadDigest: evidence.payloadDigest,
          status: evidence.status, result: evidence.result as never,
        },
      })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'SIGNATURE_EVENT', entityType: 'DocumentSignature', entityId: created.id,
        newValue: {
          documentId: id, version: version.version, signerEmail: created.signerEmail,
          provider: created.provider, envelopeId: created.providerEnvelopeId, status: created.status,
        },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return created
    })
    return NextResponse.json({ signature, signingUrl: providerResult.signingUrl }, { status: 201 })
  } catch (error) {
    if (error instanceof DocumentAccessError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Create signature request error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Signature request failed' }, { status: 502 })
  }
}

export async function PUT() {
  return NextResponse.json({ error: 'Signature state is accepted only through the verified provider webhook' }, { status: 405 })
}
