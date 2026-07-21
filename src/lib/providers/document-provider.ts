import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { canonicalJson } from '../audit'
import { requireConfig } from '../secrets'

const providerResponseSchema = z.object({
  licensed: z.literal(true),
  provider: z.string().min(1).max(100),
  eventId: z.string().min(1).max(255),
  sourceTimestamp: z.string().datetime(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(['COMPLETED', 'FAILED', 'PENDING']),
  result: z.record(z.string(), z.unknown()),
})

export interface ProviderEvidence {
  licensed: true
  provider: string
  eventId: string
  sourceTimestamp: Date
  sourceSha256: string
  status: 'COMPLETED' | 'FAILED' | 'PENDING'
  result: Record<string, unknown>
  payloadDigest: string
}

export class DocumentProviderError extends Error {}

export async function callDocumentProvider(input: {
  operation: 'ocr' | 'filing' | 'esignature'
  sourceSha256: string
  content: Buffer
  metadata: Record<string, unknown>
}): Promise<ProviderEvidence> {
  const prefix = input.operation === 'ocr' ? 'OCR' : input.operation === 'filing' ? 'FILING' : 'ESIGNATURE'
  const url = requireConfig(`${prefix}_PROVIDER_URL`)
  const token = requireConfig(`${prefix}_PROVIDER_TOKEN`)
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        operation: input.operation,
        sourceSha256: input.sourceSha256,
        contentBase64: input.content.toString('base64'),
        metadata: input.metadata,
      }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (error) {
    throw new DocumentProviderError(`${prefix} provider unavailable: ${error instanceof Error ? error.message : 'network error'}`)
  }
  if (!response.ok) throw new DocumentProviderError(`${prefix} provider returned HTTP ${response.status}`)
  let raw: unknown
  try {
    raw = await response.json()
  } catch {
    throw new DocumentProviderError(`${prefix} provider returned invalid JSON`)
  }
  const parsed = providerResponseSchema.safeParse(raw)
  if (!parsed.success) throw new DocumentProviderError(`${prefix} provider evidence is incomplete or unlicensed`)
  if (parsed.data.sourceSha256 !== input.sourceSha256) {
    throw new DocumentProviderError(`${prefix} provider source checksum does not match the submitted version`)
  }
  return {
    ...parsed.data,
    sourceTimestamp: new Date(parsed.data.sourceTimestamp),
    payloadDigest: createHash('sha256').update(canonicalJson(raw)).digest('hex'),
  }
}

export function verifyProviderWebhook(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false
  return timingSafeHexEqual(expected, signature.toLowerCase())
}

function timingSafeHexEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

const allowedSignatureTransitions: Record<string, Set<string>> = {
  PENDING: new Set(['PENDING', 'VIEWED', 'SIGNED', 'DECLINED', 'FAILED']),
  VIEWED: new Set(['VIEWED', 'SIGNED', 'DECLINED', 'FAILED']),
  SIGNED: new Set(['SIGNED']),
  DECLINED: new Set(['DECLINED']),
  FAILED: new Set(['FAILED']),
}

export function validSignatureTransition(current: string, next: string): boolean {
  return allowedSignatureTransitions[current]?.has(next) || false
}
