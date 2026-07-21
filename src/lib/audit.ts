import { createHash } from 'crypto'
import { Prisma } from '@prisma/client'
import prisma from './prisma'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'AI_CALL'
  | 'ACCESS_GRANTED'
  | 'ACCESS_REVOKED'
  | 'REVIEWED'
  | 'HOLD_PLACED'
  | 'HOLD_RELEASED'
  | 'REDACTION_APPLIED'
  | 'SIGNATURE_EVENT'
  | 'RETENTION_EVENT'
  | 'PROVIDER_EVENT'

export interface AuditOptions {
  firmId: string
  actorId?: string | null
  requestId: string
  action: AuditAction
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}

type AuditClient = Prisma.TransactionClient

function canonicalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = canonicalize((value as Record<string, unknown>)[key])
        return result
      }, {})
  }
  if (typeof value === 'bigint') return value.toString()
  return value
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

export function auditEventHash(input: Omit<AuditOptions, 'ipAddress' | 'userAgent'> & {
  sequence: bigint
  previousHash?: string | null
  createdAt: Date
}): string {
  return createHash('sha256').update(canonicalJson(input)).digest('hex')
}

export function diffShallow(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const b = before || {}
  const a = after || {}
  const out = { before: {} as Record<string, unknown>, after: {} as Record<string, unknown> }
  for (const key of Array.from(new Set([...Object.keys(b), ...Object.keys(a)]))) {
    if (canonicalJson(b[key]) !== canonicalJson(a[key])) {
      out.before[key] = b[key]
      out.after[key] = a[key]
    }
  }
  return out
}

export async function appendAuditEventTx(tx: AuditClient, opts: AuditOptions) {
  // Serialize each firm's chain. This is PostgreSQL-specific by design because
  // production and test persistence are PostgreSQL.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${opts.firmId}))`
  const previous = await tx.auditLog.findFirst({
    where: { firmId: opts.firmId },
    orderBy: { sequence: 'desc' },
  })
  const createdAt = new Date()
  const previousHash = previous?.eventHash || null
  const sequence = (previous?.sequence || 0n) + 1n
  const oldValue = opts.oldValue ?? null
  const newValue = opts.newValue ?? null
  const eventHash = auditEventHash({
    firmId: opts.firmId,
    actorId: opts.actorId,
    requestId: opts.requestId,
    action: opts.action,
    entityType: opts.entityType,
    entityId: opts.entityId,
    oldValue,
    newValue,
    sequence,
    previousHash,
    createdAt,
  })

  return tx.auditLog.create({
    data: {
      firmId: opts.firmId,
      actorId: opts.actorId || null,
      requestId: opts.requestId,
      sequence,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      oldValue: oldValue === null ? Prisma.JsonNull : oldValue as Prisma.InputJsonValue,
      newValue: newValue === null ? Prisma.JsonNull : newValue as Prisma.InputJsonValue,
      ipAddress: opts.ipAddress || null,
      userAgent: opts.userAgent || null,
      previousHash,
      eventHash,
      createdAt,
    },
  })
}

export async function auditLog(opts: AuditOptions) {
  return prisma.$transaction((tx) => appendAuditEventTx(tx, opts))
}

export async function verifyAuditChain(firmId: string): Promise<boolean> {
  const events = await prisma.auditLog.findMany({
    where: { firmId },
    orderBy: { sequence: 'asc' },
  })
  let previousHash: string | null = null
  let sequence = 1n
  for (const event of events) {
    if (event.previousHash !== previousHash || event.sequence !== sequence) return false
    const expected = auditEventHash({
      firmId: event.firmId,
      actorId: event.actorId,
      requestId: event.requestId,
      action: event.action as AuditAction,
      entityType: event.entityType,
      entityId: event.entityId,
      oldValue: event.oldValue,
      newValue: event.newValue,
      sequence: event.sequence,
      previousHash,
      createdAt: event.createdAt,
    })
    if (event.eventHash !== expected) return false
    previousHash = event.eventHash
    sequence += 1n
  }
  return true
}
