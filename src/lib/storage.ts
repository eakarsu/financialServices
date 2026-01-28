import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Storage configuration
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local' // 'local' or 's3'
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads'

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const S3_BUCKET = process.env.AWS_S3_BUCKET || ''

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
    fileName = `${uuidv4()}-${originalName}`,
    makePublic = false,
  } = options

  const size = file.length
  const key = `${folder}/${fileName}`

  if (STORAGE_TYPE === 's3') {
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
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ACL: makePublic ? 'public-read' : 'private',
    Metadata: {
      uploadedAt: new Date().toISOString(),
    },
  })

  await s3Client.send(command)

  const url = makePublic
    ? `https://${S3_BUCKET}.s3.amazonaws.com/${key}`
    : await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), {
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
  const filePath = path.join(LOCAL_UPLOAD_DIR, key)
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
  if (STORAGE_TYPE === 's3') {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
    await s3Client.send(command)
  } else {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key)
    await unlink(filePath)
  }
}

/**
 * Get signed URL for private file (S3 only)
 */
export async function getSignedFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (STORAGE_TYPE === 's3') {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
    return await getSignedUrl(s3Client, command, { expiresIn })
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
  if (STORAGE_TYPE === 's3') {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
    const response = await s3Client.send(command)
    return Buffer.from(await response.Body!.transformToByteArray())
  } else {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key)
    const fs = await import('fs/promises')
    return await fs.readFile(filePath)
  }
}
