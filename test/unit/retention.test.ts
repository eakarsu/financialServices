import test from 'node:test'
import assert from 'node:assert/strict'
import { retentionDecision } from '../../src/lib/retention'

const now = new Date('2026-07-19T12:00:00Z')

test('active legal holds override an expired retention date', () => {
  assert.equal(retentionDecision({ current: 'ACTIVE', retainUntil: new Date('2025-01-01'), activeHoldCount: 1, now }), 'BLOCKED_BY_HOLD')
})

test('expired unheld documents become eligible', () => {
  assert.equal(retentionDecision({ current: 'ACTIVE', retainUntil: new Date('2025-01-01'), activeHoldCount: 0, now }), 'ELIGIBLE')
})

test('future retention remains active', () => {
  assert.equal(retentionDecision({ current: 'ELIGIBLE', retainUntil: new Date('2027-01-01'), activeHoldCount: 0, now }), 'ACTIVE')
})

test('disposed evidence never reactivates', () => {
  assert.equal(retentionDecision({ current: 'DISPOSED', retainUntil: null, activeHoldCount: 3, now }), 'DISPOSED')
})
