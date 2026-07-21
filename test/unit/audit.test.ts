import test from 'node:test'
import assert from 'node:assert/strict'
import { auditEventHash, canonicalJson, diffShallow } from '../../src/lib/audit'

test('canonical JSON is independent of object key order', () => {
  assert.equal(canonicalJson({ b: 2, a: { d: 4, c: 3 } }), canonicalJson({ a: { c: 3, d: 4 }, b: 2 }))
})

test('audit hashes bind sequence and prior event', () => {
  const base = {
    firmId: 'firm', actorId: 'actor', requestId: 'request', action: 'CREATE' as const,
    entityType: 'Document', entityId: 'doc', oldValue: null, newValue: { version: 1 },
    sequence: 1n, previousHash: null, createdAt: new Date('2026-07-19T12:00:00Z'),
  }
  assert.notEqual(auditEventHash(base), auditEventHash({ ...base, sequence: 2n }))
  assert.notEqual(auditEventHash(base), auditEventHash({ ...base, previousHash: 'changed' }))
})

test('shallow diff stores only changed fields', () => {
  assert.deepEqual(diffShallow({ same: 1, old: 'a' }, { same: 1, old: 'b' }), {
    before: { old: 'a' }, after: { old: 'b' },
  })
})
