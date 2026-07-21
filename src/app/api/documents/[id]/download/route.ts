import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { getFile } from '@/lib/storage'
import { requestContext } from '@/lib/request-context'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const document = await getDocumentForAccess(id, user, 'VIEW')
    if (document.retentionDisposition === 'DISPOSED') {
      return NextResponse.json({ error: 'Document content has been disposed' }, { status: 410 })
    }
    const requestedVersion = request.nextUrl.searchParams.get('version')
    const versionNumber = requestedVersion ? Number.parseInt(requestedVersion, 10) : document.version
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      return NextResponse.json({ error: 'Invalid version' }, { status: 400 })
    }
    const version = await prisma.documentVersion.findUnique({
      where: { documentId_version: { documentId: id, version: versionNumber } },
    })
    if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    const content = await getFile(version.storageKey)
    if (content.length !== version.fileSize) throw new Error('Stored file size does not match provenance')
    const context = requestContext(request)
    await auditLog({
      firmId: user.firmId, actorId: user.id, requestId: context.requestId,
      action: 'EXPORT', entityType: 'DocumentVersion', entityId: version.id,
      newValue: { documentId: id, version: version.version, contentSha256: version.contentSha256 },
      ipAddress: context.ipAddress, userAgent: context.userAgent,
    })
    const encodedName = encodeURIComponent(document.name)
    return new NextResponse(new Uint8Array(content), {
      status: 200,
      headers: {
        'Content-Type': version.mimeType,
        'Content-Length': String(content.length),
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (error instanceof DocumentAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Document download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
