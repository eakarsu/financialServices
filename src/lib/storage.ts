import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireConfig } from './secrets'

function storageType(): 'local' | 's3' {
  const configured = process.env.STORAGE_TYPE || 'local'
  if (configured !== 'local' && configured !== 's3') throw new Error('STORAGE_TYPE must be local or s3')
  if (process.env.NODE_ENV === 'production' && configured === 'local') {
    throw new Error('Production document storage must use configured private S3 storage')
  }
  return configured
}

function localUploadDir(): string {
  return path.resolve(process.env.LOCAL_UPLOAD_DIR || './uploads')
}

function s3Config() {
  const region = requireConfig('AWS_REGION')
  const bucket = requireConfig('AWS_S3_BUCKET')
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: requireConfig('AWS_ACCESS_KEY_ID'),
      secretAccessKey: requireConfig('AWS_SECRET_ACCESS_KEY'),
    },
  })
  return { client, bucket }
}

export function safeStorageSegment(value: string): string {
  const normalized = value.normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '_')
  if (!normalized || normalized === '.' || normalized === '..' || normalized.includes('..')) {
    throw new Error('Invalid storage path segment')
  }
  return normalized.slice(0, 180)
}

export interface UploadResult {
  url: string
  key: string
  size: number
  mimeType: string
}

export interface UploadOptions {
  folder?: string
  fileName?: string
  makePublic?: boolean
}

/**
 * Upload file to storage (S3 or local)
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = 'documents',
    fileName = `${randomUUID()}-${safeStorageSegment(path.basename(originalName))}`,
    makePublic = false,
  } = options

  const size = file.length
  const safeFolder = folder.split('/').filter(Boolean).map(safeStorageSegment).join('/')
  const key = `${safeFolder}/${safeStorageSegment(fileName)}`

  if (storageType() === 's3') {
    return uploadToS3(file, key, mimeType, size, makePublic)
  } else {
    return uploadToLocal(file, key, mimeType, size)
  }
}

/**
 * Upload to AWS S3
 */
async function uploadToS3(
  file: Buffer | Uint8Array,
  key: string,
  mimeType: string,
  size: number,
  makePublic: boolean
): Promise<UploadResult> {
  const { client, bucket } = s3Config()
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ACL: makePublic ? 'public-read' : 'private',
    Metadata: {
      uploadedAt: new Date().toISOString(),
    },
  })

  await client.send(command)

  const url = makePublic
    ? `https://${bucket}.s3.amazonaws.com/${key}`
    : await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn: 3600,
      })

  return { url, key, size, mimeType }
}

/**
 * Upload to local filesystem
 */
async function uploadToLocal(
  file: Buffer | Uint8Array,
  key: string,
  mimeType: string,
  size: number
): Promise<UploadResult> {
  const filePath = path.join(localUploadDir(), key)
  const dir = path.dirname(filePath)

  // Ensure directory exists
  await mkdir(dir, { recursive: true })

  // Write file
  await writeFile(filePath, file)

  const url = `/uploads/${key}`
  return { url, key, size, mimeType }
}

/**
 * Delete file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  if (storageType() === 's3') {
    const { client, bucket } = s3Config()
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    await client.send(command)
  } else {
    const filePath = path.join(localUploadDir(), key)
    await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}

/**
 * Get signed URL for private file (S3 only)
 */
export async function getSignedFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (storageType() === 's3') {
    const { client, bucket } = s3Config()
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    return await getSignedUrl(client, command, { expiresIn })
  } else {
    return `/uploads/${key}`
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  return Promise.all(
    files.map(file => uploadFile(file.buffer, file.originalName, file.mimeType, options))
  )
}

/**
 * Get file from storage
 */
export async function getFile(key: string): Promise<Buffer> {
  if (storageType() === 's3') {
    const { client, bucket } = s3Config()
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    const response = await client.send(command)
    return Buffer.from(await response.Body!.transformToByteArray())
  } else {
    const filePath = path.join(localUploadDir(), key)
    const fs = await import('fs/promises')
    return await fs.readFile(filePath)
  }
}
