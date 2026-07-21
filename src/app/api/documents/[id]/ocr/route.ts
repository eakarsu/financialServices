import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { sha256 } from '@/lib/documents'
import { getFile } from '@/lib/storage'
import { callDocumentProvider } from '@/lib/providers/document-provider'
import { recordProviderEvent } from '@/lib/provider-events'
import { requestContext } from '@/lib/request-context'

const ocrResult = z.object({ text: z.string(), confidence: z.number().min(0).max(1), pageCount: z.number().int().positive() })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const document = await getDocumentForAccess(id, user, 'EDIT')
    const version = await prisma.documentVersion.findUniqueOrThrow({
      where: { documentId_version: { documentId: id, version: document.version } },
    })
    const content = await getFile(version.storageKey)
    if (sha256(content) !== version.contentSha256) throw new Error('Stored document checksum does not match provenance')
    const evidence = await callDocumentProvider({
      operation: 'ocr', sourceSha256: version.contentSha256, content,
      metadata: { documentId: id, version: version.version, mimeType: version.mimeType },
    })
    if (evidence.status === 'COMPLETED') ocrResult.parse(evidence.result)
    const event = await recordProviderEvent({
      firmId: user.firmId, actor: user, versionId: version.id, operation: 'OCR', evidence,
      context: requestContext(request),
    })
    return NextResponse.json(event, { status: evidence.status === 'FAILED' ? 422 : 201 })
  } catch (error) {
    if (error instanceof DocumentAccessError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('OCR processing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'OCR failed' }, { status: 502 })
  }
}
