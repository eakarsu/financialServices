import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadFile } from '@/lib/storage'
import prisma from '@/lib/prisma'
import { Permission, hasPermission } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.UPLOAD_DOCUMENTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string
    const category = formData.get('category') as string || 'General'
    const documentType = formData.get('type') as string || 'OTHER'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to storage
    const uploadResult = await uploadFile(buffer, file.name, file.type, {
      folder: `clients/${clientId}/documents`,
    })

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: documentType as never,
        category,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimeType,
        status: 'DRAFT',
        clientId: clientId || undefined,
        uploadedById: user.id,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
