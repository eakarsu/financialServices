import { randomUUID } from 'crypto'
import { DocumentType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadFile, deleteFile } from '@/lib/storage'
import { Permission, hasPermission } from '@/lib/permissions'
import { createDocumentRecord, sha256, validateDocumentFile } from '@/lib/documents'
import { requestContext } from '@/lib/request-context'

export const runtime = 'nodejs'

function optionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export async function POST(request: NextRequest) {
  let uploadedKey: string | undefined
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(user.role, Permission.UPLOAD_DOCUMENTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    validateDocumentFile(file.size, file.type)

    const type = optionalString(formData, 'type') || 'OTHER'
    if (!Object.values(DocumentType).includes(type as DocumentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }
    const clientId = optionalString(formData, 'clientId')
    const bytes = Buffer.from(await file.arrayBuffer())
    const digest = sha256(bytes)
    const upload = await uploadFile(bytes, file.name, file.type, {
      folder: `firms/${user.firmId}/clients/${clientId || 'unassigned'}/documents`,
    })
    uploadedKey = upload.key

    const taxYearValue = optionalString(formData, 'taxYear')
    const taxYear = taxYearValue ? Number.parseInt(taxYearValue, 10) : undefined
    if (taxYear !== undefined && (!Number.isInteger(taxYear) || taxYear < 1900 || taxYear > 2200)) {
      throw new Error('Invalid tax year')
    }
    const document = await createDocumentRecord(user, {
      name: optionalString(formData, 'name') || file.name,
      description: optionalString(formData, 'description'),
      type: type as DocumentType,
      category: optionalString(formData, 'category') || 'General',
      clientId,
      folderId: optionalString(formData, 'folderId'),
      engagementId: optionalString(formData, 'engagementId'),
      taxYear,
      retainUntil: optionalString(formData, 'retainUntil') ? new Date(optionalString(formData, 'retainUntil')!) : undefined,
      expiresAt: optionalString(formData, 'expiresAt') ? new Date(optionalString(formData, 'expiresAt')!) : undefined,
      isPrivileged: optionalString(formData, 'isPrivileged') === 'true',
      jurisdiction: optionalString(formData, 'jurisdiction'),
      effectiveDate: optionalString(formData, 'effectiveDate') ? new Date(optionalString(formData, 'effectiveDate')!) : undefined,
    }, {
      storageKey: upload.key,
      size: upload.size,
      mimeType: upload.mimeType,
      contentSha256: digest,
      sourceType: 'UPLOAD',
      sourceProvider: 'user-upload',
      sourceEventId: randomUUID(),
      sourceTimestamp: new Date(),
    }, requestContext(request))
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    if (uploadedKey) await deleteFile(uploadedKey).catch((cleanupError) => console.error('Upload cleanup failed:', cleanupError))
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
