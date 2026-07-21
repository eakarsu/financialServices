import { createHash } from 'crypto'
import { z } from 'zod'
import { canonicalJson } from '../audit'
import { requireConfig } from '../secrets'

const templateSchema = z.object({
  licensed: z.literal(true),
  authorityName: z.string().min(1).max(255),
  sourceEventId: z.string().min(1).max(255),
  sourceTimestamp: z.string().datetime(),
  jurisdiction: z.string().min(1).max(100),
  effectiveDate: z.string().datetime(),
  expiresAt: z.string().datetime().nullable().optional(),
  content: z.string().min(1),
  variables: z.record(z.string(), z.unknown()).optional(),
})

export async function fetchAuthoritativeTemplate(authorityUrl: string) {
  const url = new URL(authorityUrl)
  if (url.protocol !== 'https:') throw new Error('Authoritative template URL must use HTTPS')
  const allowedHosts = requireConfig('TEMPLATE_AUTHORITY_ALLOWLIST').split(',').map((host) => host.trim()).filter(Boolean)
  if (!allowedHosts.includes(url.hostname)) throw new Error('Template authority host is not allowlisted')
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${requireConfig('TEMPLATE_AUTHORITY_TOKEN')}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`Template authority returned HTTP ${response.status}`)
  const raw = await response.json()
  const parsed = templateSchema.safeParse(raw)
  if (!parsed.success) throw new Error('Template authority evidence is incomplete or unlicensed')
  const sourceTimestamp = new Date(parsed.data.sourceTimestamp)
  if (sourceTimestamp > new Date(Date.now() + 5 * 60 * 1000)) throw new Error('Template source timestamp is in the future')
  return {
    ...parsed.data,
    sourceTimestamp,
    effectiveDate: new Date(parsed.data.effectiveDate),
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    contentSha256: createHash('sha256').update(parsed.data.content).digest('hex'),
    payloadDigest: createHash('sha256').update(canonicalJson(raw)).digest('hex'),
  }
}
