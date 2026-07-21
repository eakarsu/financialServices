import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { addDocumentVersion, sha256 } from '@/lib/documents'
import { applyTextRedactions } from '@/lib/redaction'
import { deleteFile, getFile, uploadFile } from '@/lib/storage'
import { requestContext } from '@/lib/request-context'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; redactionId: string }> }
) {
  let uploadedKey: string | undefined
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'PARTNER', 'MANAGER'].includes(user.role)) return NextResponse.json({ error: 'Independent reviewer role is required' }, { status: 403 })
    const { id, redactionId } = await params
    const document = await getDocumentForAccess(id, user, 'EDIT')
    const redaction = await prisma.documentRedaction.findFirst({
      where: { id: redactionId, documentId: id }, include: { sourceVersion: true },
    })
    if (!redaction) return NextResponse.json({ error: 'Redaction not found' }, { status: 404 })
    if (redaction.createdById === user.id) return NextResponse.json({ error: 'Redaction creator cannot review their own request' }, { status: 403 })
    if (redaction.status !== 'PENDING_REVIEW') return NextResponse.json({ error: 'Redaction is not pending review' }, { status: 409 })
    const input = await request.json()
    const context = requestContext(request)
    if (input.decision === 'REJECTED') {
      const rejected = await prisma.$transaction(async (tx) => {
        const updated = await tx.documentRedaction.update({
          where: { id: redactionId }, data: { status: 'REJECTED', reviewedById: user.id, reviewedAt: new Date() },
        })
        await appendAuditEventTx(tx, {
          firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
          action: 'REVIEWED', entityType: 'DocumentRedaction', entityId: redactionId,
          oldValue: { status: redaction.status }, newValue: { status: 'REJECTED' },
          ipAddress: context.ipAddress, userAgent: context.userAgent,
        })
        return updated
      })
      return NextResponse.json(rejected)
    }
    if (input.decision !== 'APPROVED') return NextResponse.json({ error: 'Decision must be APPROVED or REJECTED' }, { status: 400 })
    if (document.version !== redaction.sourceVersion.version) {
      return NextResponse.json({ error: 'A newer document version conflicts with this redaction' }, { status: 409 })
    }
    const sourceBytes = await getFile(redaction.sourceVersion.storageKey)
    if (sha256(sourceBytes) !== redaction.sourceVersion.contentSha256) throw new Error('Source provenance checksum mismatch')
    const redactedText = applyTextRedactions(sourceBytes.toString('utf8'), redaction.ranges)
    const redactedBytes = Buffer.from(redactedText, 'utf8')
    const upload = await uploadFile(redactedBytes, `${document.name}.redacted.txt`, 'text/plain', {
      folder: `firms/${document.firmId}/documents/${document.id}/redactions`,
    })
    uploadedKey = upload.key
    const version = await addDocumentVersion(document, user.id, {
      storageKey: upload.key, size: upload.size, mimeType: upload.mimeType,
      contentSha256: sha256(redactedBytes), sourceType: 'REDACTION', sourceProvider: 'deterministic-text-redactor',
      sourceEventId: randomUUID(), sourceTimestamp: new Date(),
    }, `Approved redaction ${redaction.id}: ${redaction.reason}`, context)
    // The immutable version now owns this object; never delete its bytes during
    // later redaction-status error handling.
    uploadedKey = undefined
    const applied = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentRedaction.update({
        where: { id: redactionId },
        data: { status: 'APPLIED', reviewedById: user.id, reviewedAt: new Date(), appliedAt: new Date(), targetVersionId: version.id },
      })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'REDACTION_APPLIED', entityType: 'DocumentRedaction', entityId: redactionId,
        oldValue: { sourceVersion: redaction.sourceVersion.version },
        newValue: { targetVersion: version.version, contentSha256: version.contentSha256 },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return updated
    })
    return NextResponse.json(applied)
  } catch (error) {
    if (uploadedKey) await deleteFile(uploadedKey).catch(() => undefined)
    if (error instanceof DocumentAccessError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Redaction review error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Redaction review failed' }, { status: 400 })
  }
}
