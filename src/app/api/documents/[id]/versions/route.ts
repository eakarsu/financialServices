import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getDocumentForAccess, DocumentAccessError } from '@/lib/document-governance'
import { addDocumentVersion, sha256, validateDocumentFile } from '@/lib/documents'
import { deleteFile, uploadFile } from '@/lib/storage'
import { requestContext } from '@/lib/request-context'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let uploadedKey: string | undefined
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const document = await getDocumentForAccess(id, user, 'EDIT')
    const form = await request.formData()
    const file = form.get('file')
    const changeNote = form.get('changeNote')
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (typeof changeNote !== 'string' || !changeNote.trim()) {
      return NextResponse.json({ error: 'Change note is required' }, { status: 400 })
    }
    validateDocumentFile(file.size, file.type)
    const bytes = Buffer.from(await file.arrayBuffer())
    const upload = await uploadFile(bytes, file.name, file.type, {
      folder: `firms/${document.firmId}/documents/${document.id}/versions`,
    })
    uploadedKey = upload.key
    const version = await addDocumentVersion(document, user.id, {
      storageKey: upload.key,
      size: upload.size,
      mimeType: upload.mimeType,
      contentSha256: sha256(bytes),
      sourceType: 'UPLOAD',
      sourceProvider: 'user-upload',
      sourceEventId: randomUUID(),
      sourceTimestamp: new Date(),
    }, changeNote.trim().slice(0, 1000), requestContext(request))
    return NextResponse.json(version, { status: 201 })
  } catch (error) {
    if (uploadedKey) await deleteFile(uploadedKey).catch((cleanupError) => console.error('Version cleanup failed:', cleanupError))
    if (error instanceof DocumentAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Create document version error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Version creation failed' }, { status: 400 })
  }
}
