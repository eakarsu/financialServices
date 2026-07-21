import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { appendAuditEventTx } from '@/lib/audit'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { normalizeRedactionRanges } from '@/lib/redaction'
import { requestContext } from '@/lib/request-context'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const document = await getDocumentForAccess(id, user, 'EDIT')
    const input = await request.json()
    if (typeof input.reason !== 'string' || !input.reason.trim()) {
      return NextResponse.json({ error: 'Redaction reason is required' }, { status: 400 })
    }
    const ranges = normalizeRedactionRanges(input.ranges)
    const version = await prisma.documentVersion.findUniqueOrThrow({
      where: { documentId_version: { documentId: id, version: document.version } },
    })
    if (version.mimeType !== 'text/plain') {
      return NextResponse.json({ error: 'Binary/PDF redaction requires a configured content-preserving redaction provider' }, { status: 422 })
    }
    const context = requestContext(request)
    const redaction = await prisma.$transaction(async (tx) => {
      const created = await tx.documentRedaction.create({
        data: {
          documentId: id, sourceVersionId: version.id, createdById: user.id,
          reason: input.reason.trim().slice(0, 2000), ranges: ranges as never, status: 'PENDING_REVIEW',
        },
      })
      await appendAuditEventTx(tx, {
        firmId: user.firmId!, actorId: user.id, requestId: context.requestId,
        action: 'CREATE', entityType: 'DocumentRedaction', entityId: created.id,
        newValue: { documentId: id, sourceVersion: version.version, ranges, reason: created.reason },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      })
      return created
    })
    return NextResponse.json(redaction, { status: 201 })
  } catch (error) {
    if (error instanceof DocumentAccessError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Redaction request failed' }, { status: 400 })
  }
}
