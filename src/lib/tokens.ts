import { createHash, randomBytes } from 'crypto'

export function createOpaqueToken(): string {
  return randomBytes(32).toString('hex')
}

export function tokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
