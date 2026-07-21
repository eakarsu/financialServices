import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { DocumentAccessError, getDocumentForAccess, validateReviewEvidence } from '@/lib/document-governance'
import { sha256 } from '@/lib/documents'
import { getFile } from '@/lib/storage'
import { callDocumentProvider } from '@/lib/providers/document-provider'
import { recordProviderEvent } from '@/lib/provider-events'
import { requestContext } from '@/lib/request-context'

const filingResult = z.object({
  filingReceiptId: z.string().min(1),
  jurisdiction: z.string().min(1),
  acceptedAt: z.string().datetime().optional(),
  rejectionCode: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'PARTNER', 'MANAGER'].includes(user.role)) return NextResponse.json({ error: 'Professional reviewer role is required' }, { status: 403 })
    const { id } = await params
    const document = await getDocumentForAccess(id, user, 'EDIT')
    if (document.reviewStatus !== 'APPROVED') return NextResponse.json({ error: 'Only an approved version may be filed' }, { status: 409 })
    validateReviewEvidence(document)
    const version = await prisma.documentVersion.findUniqueOrThrow({
      where: { documentId_version: { documentId: id, version: document.version } },
    })
    if (version.reviewStatus !== 'APPROVED') return NextResponse.json({ error: 'Current version has not been approved' }, { status: 409 })
    const content = await getFile(version.storageKey)
    if (sha256(content) !== version.contentSha256) throw new Error('Stored document checksum does not match provenance')
    const evidence = await callDocumentProvider({
      operation: 'filing', sourceSha256: version.contentSha256, content,
      metadata: {
        documentId: id, version: version.version, mimeType: version.mimeType,
        jurisdiction: document.jurisdiction, effectiveDate: document.effectiveDate?.toISOString(),
      },
    })
    filingResult.parse(evidence.result)
    const event = await recordProviderEvent({
      firmId: user.firmId, actor: user, versionId: version.id, operation: 'FILING', evidence,
      context: requestContext(request),
    })
    return NextResponse.json(event, { status: evidence.status === 'FAILED' ? 422 : 201 })
  } catch (error) {
    if (error instanceof DocumentAccessError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Filing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Filing failed' }, { status: 502 })
  }
}
