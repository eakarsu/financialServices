/**
 * Audit log helper. Captures create/update/delete operations for accounting
 * standards & SOX-style traceability.
 */
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

export interface AuditOptions {
  action: AuditAction
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Compute a shallow diff between two records — used as `newValue` for UPDATE
 * actions so AuditLog only stores changed fields.
 */
export function diffShallow(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const b = before || {}
  const a = after || {}
  const out = {
    before: {} as Record<string, unknown>,
    after: {} as Record<string, unknown>,
  }
  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]))
  for (const k of keys) {
    if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) {
      out.before[k] = b[k]
      out.after[k] = a[k]
    }
  }
  return out
}

export async function auditLog(opts: AuditOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        oldValue: (opts.oldValue ?? null) as never,
        newValue: (opts.newValue ?? null) as never,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    })
  } catch (err) {
    // Audit logging must never break a request
    console.error('auditLog failed:', err)
  }
}
