import test from 'node:test'
import assert from 'node:assert/strict'
import { applyTextRedactions, normalizeRedactionRanges } from '../../src/lib/redaction'

test('text redaction replaces the exact selected evidence', () => {
  assert.equal(applyTextRedactions('SSN 123-45-6789 approved', [{ start: 4, end: 15 }]), 'SSN [REDACTED] approved')
})

test('multiple redactions retain unselected text', () => {
  assert.equal(applyTextRedactions('alpha beta gamma', [
    { start: 0, end: 5, replacement: 'X' },
    { start: 11, end: 16, replacement: 'Y' },
  ]), 'X beta Y')
})

test('overlapping redactions are rejected', () => {
  assert.throws(() => normalizeRedactionRanges([{ start: 0, end: 5 }, { start: 4, end: 8 }]), /overlap/)
})

test('out-of-bounds redactions are rejected', () => {
  assert.throws(() => applyTextRedactions('short', [{ start: 1, end: 9 }]), /outside/)
})

test('an empty redaction request is rejected', () => {
  assert.throws(() => normalizeRedactionRanges([]), /At least one/)
})
