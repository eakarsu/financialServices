import { createHash, randomUUID } from 'crypto'
import type { DocumentType, Prisma, ReviewStatus, User } from '@prisma/client'
import prisma from './prisma'
import { appendAuditEventTx } from './audit'
import { validateReviewEvidence } from './document-governance'

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

export interface DocumentEvidence {
  storageKey: string
  size: number
  mimeType: string
  contentSha256: string
  sourceType: string
  sourceProvider?: string | null
  sourceEventId?: string | null
  sourceTimestamp?: Date | null
}

export interface DocumentMetadata {
  name: string
  description?: string | null
  type: DocumentType
  category?: string | null
  clientId?: string | null
  engagementId?: string | null
  folderId?: string | null
  taxYear?: number | null
  expiresAt?: Date | null
  retainUntil?: Date | null
  isPrivileged?: boolean
  jurisdiction?: string | null
  effectiveDate?: Date | null
}

interface MutationContext {
  requestId: string
  ipAddress?: string | null
  userAgent?: string | null
}

export function sha256(content: Buffer | Uint8Array | string): string {
  return createHash('sha256').update(content).digest('hex')
}

export function validateDocumentFile(size: number, mimeType: string): void {
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_DOCUMENT_BYTES) {
    throw new Error(`Document must be between 1 byte and ${MAX_DOCUMENT_BYTES} bytes`)
  }
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType)) throw new Error('Unsupported document MIME type')
}

async function validateScope(
  firmId: string,
  input: Pick<DocumentMetadata, 'clientId' | 'engagementId' | 'folderId'>
): Promise<void> {
  if (input.clientId) {
    const client = await prisma.client.findFirst({ where: { id: input.clientId, firmId }, select: { id: true } })
    if (!client) throw new Error('Client is outside the authenticated firm')
  }
  if (input.folderId) {
    const folder = await prisma.documentFolder.findFirst({ where: { id: input.folderId, firmId }, select: { id: true } })
    if (!folder) throw new Error('Folder is outside the authenticated firm')
  }
  if (input.engagementId) {
    const engagement = await prisma.engagement.findFirst({
      where: { id: input.engagementId, client: { firmId } },
      select: { clientId: true },
    })
    if (!engagement || (input.clientId && engagement.clientId !== input.clientId)) {
      throw new Error('Engagement is outside the document matter')
    }
  }
}

export async function createDocumentRecord(
  actor: Pick<User, 'id' | 'firmId'>,
  metadata: DocumentMetadata,
  evidence: DocumentEvidence,
  context: MutationContext
) {
  if (!actor.firmId) throw new Error('Firm membership is required')
  validateDocumentFile(evidence.size, evidence.mimeType)
  if (!/^[a-f0-9]{64}$/.test(evidence.contentSha256)) throw new Error('Invalid SHA-256 evidence')
  await validateScope(actor.firmId, metadata)

  const id = randomUUID()
  const fileUrl = `/api/documents/${id}/download`
  return prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        id,
        firmId: actor.firmId!,
        uploadedById: actor.id,
        name: metadata.name.trim(),
        description: metadata.description,
        type: metadata.type,
        category: metadata.category,
        clientId: metadata.clientId,
        engagementId: metadata.engagementId,
        folderId: metadata.folderId,
        taxYear: metadata.taxYear,
        expiresAt: metadata.expiresAt,
        retainUntil: metadata.retainUntil,
        isPrivileged: metadata.isPrivileged || false,
        jurisdiction: metadata.jurisdiction,
        effectiveDate: metadata.effectiveDate,
        fileUrl,
        storageKey: evidence.storageKey,
        contentSha256: evidence.contentSha256,
        fileSize: evidence.size,
        mimeType: evidence.mimeType,
        reviewStatus: 'PENDING',
        versions: {
          create: {
            version: 1,
            fileUrl: `${fileUrl}?version=1`,
            storageKey: evidence.storageKey,
            contentSha256: evidence.contentSha256,
            fileSize: evidence.size,
            mimeType: evidence.mimeType,
            sourceType: evidence.sourceType,
            sourceProvider: evidence.sourceProvider,
            sourceEventId: evidence.sourceEventId,
            sourceTimestamp: evidence.sourceTimestamp,
            jurisdiction: metadata.jurisdiction,
            effectiveDate: metadata.effectiveDate,
            createdById: actor.id,
          },
        },
      },
      include: { versions: true },
    })
    await appendAuditEventTx(tx, {
      firmId: actor.firmId!, actorId: actor.id, requestId: context.requestId,
      action: 'CREATE', entityType: 'Document', entityId: document.id,
      newValue: {
        version: 1, contentSha256: evidence.contentSha256, storageKey: evidence.storageKey,
        clientId: document.clientId, privileged: document.isPrivileged, sourceType: evidence.sourceType,
      },
      ipAddress: context.ipAddress, userAgent: context.userAgent,
    })
    return document
  })
}

export async function addDocumentVersion(
  document: { id: string; firmId: string },
  actorId: string,
  evidence: DocumentEvidence,
  changeNote: string,
  context: MutationContext
) {
  validateDocumentFile(evidence.size, evidence.mimeType)
  return prisma.$transaction(async (tx) => {
    const current = await tx.document.update({
      where: { id: document.id },
      data: {
        version: { increment: 1 },
        fileUrl: `/api/documents/${document.id}/download`,
        storageKey: evidence.storageKey,
        contentSha256: evidence.contentSha256,
        fileSize: evidence.size,
        mimeType: evidence.mimeType,
        reviewStatus: 'PENDING',
        reviewedAt: null,
        reviewedById: null,
        status: 'PENDING_REVIEW',
      },
      select: { version: true },
    })
    const version = await tx.documentVersion.create({
      data: {
        documentId: document.id,
        version: current.version,
        fileUrl: `/api/documents/${document.id}/download?version=${current.version}`,
        storageKey: evidence.storageKey,
        contentSha256: evidence.contentSha256,
        fileSize: evidence.size,
        mimeType: evidence.mimeType,
        changeNote,
        sourceType: evidence.sourceType,
        sourceProvider: evidence.sourceProvider,
        sourceEventId: evidence.sourceEventId,
        sourceTimestamp: evidence.sourceTimestamp,
        createdById: actorId,
      },
    })
    await appendAuditEventTx(tx, {
      firmId: document.firmId, actorId, requestId: context.requestId,
      action: 'UPDATE', entityType: 'DocumentVersion', entityId: version.id,
      newValue: { documentId: document.id, version: version.version, contentSha256: version.contentSha256 },
      ipAddress: context.ipAddress, userAgent: context.userAgent,
    })
    return version
  })
}

export async function reviewDocumentVersion(
  document: { id: string; firmId: string; type: string; uploadedById: string; version: number },
  reviewer: Pick<User, 'id' | 'role'>,
  decision: Extract<ReviewStatus, 'APPROVED' | 'REJECTED'>,
  evidence: { jurisdiction?: string | null; effectiveDate?: Date | null; note: string },
  context: MutationContext
) {
  if (!['ADMIN', 'PARTNER', 'MANAGER'].includes(reviewer.role)) throw new Error('Independent reviewer role is required')
  if (reviewer.id === document.uploadedById) throw new Error('A document creator cannot approve their own version')
  if (!evidence.note.trim()) throw new Error('Review note is required')
  if (decision === 'APPROVED') validateReviewEvidence({ type: document.type, ...evidence })

  return prisma.$transaction(async (tx) => {
    const version = await tx.documentVersion.findUniqueOrThrow({
      where: { documentId_version: { documentId: document.id, version: document.version } },
    })
    // Review fields are the only mutable attributes on a version; the database
    // trigger enforces this exception and blocks evidence/provenance changes.
    const reviewed = await tx.documentVersion.update({
      where: { id: version.id },
      data: {
        reviewStatus: decision,
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
        jurisdiction: evidence.jurisdiction,
        effectiveDate: evidence.effectiveDate,
      },
    })
    await tx.document.update({
      where: { id: document.id },
      data: {
        reviewStatus: decision,
        reviewedById: reviewer.id,
        reviewedAt: reviewed.reviewedAt,
        jurisdiction: evidence.jurisdiction,
        effectiveDate: evidence.effectiveDate,
        status: decision === 'APPROVED' ? 'APPROVED' : 'DRAFT',
      },
    })
    await appendAuditEventTx(tx, {
      firmId: document.firmId, actorId: reviewer.id, requestId: context.requestId,
      action: 'REVIEWED', entityType: 'DocumentVersion', entityId: version.id,
      oldValue: { reviewStatus: version.reviewStatus },
      newValue: { reviewStatus: decision, note: evidence.note, jurisdiction: evidence.jurisdiction, effectiveDate: evidence.effectiveDate },
      ipAddress: context.ipAddress, userAgent: context.userAgent,
    })
    return reviewed
  })
}

export type TransactionClient = Prisma.TransactionClient
