import test from 'node:test'
import assert from 'node:assert/strict'
import {
  accessLevelSatisfies,
  activeGrant,
  requiresProfessionalReview,
  validateReviewEvidence,
} from '../../src/lib/document-governance'

test('document access levels are ordered', () => {
  assert.equal(accessLevelSatisfies('MANAGE', 'VIEW'), true)
  assert.equal(accessLevelSatisfies('EDIT', 'MANAGE'), false)
})

test('active grants reject revocation and expiration', () => {
  const future = new Date(Date.now() + 60_000)
  const past = new Date(Date.now() - 60_000)
  assert.equal(activeGrant({ accessLevel: 'EDIT', expiresAt: future, revokedAt: null }, 'VIEW'), true)
  assert.equal(activeGrant({ accessLevel: 'EDIT', expiresAt: past, revokedAt: null }, 'VIEW'), false)
  assert.equal(activeGrant({ accessLevel: 'MANAGE', expiresAt: null, revokedAt: new Date() }, 'VIEW'), false)
})

test('contracts and engagement letters require professional review', () => {
  assert.equal(requiresProfessionalReview('CONTRACT'), true)
  assert.equal(requiresProfessionalReview('ENGAGEMENT_LETTER'), true)
  assert.equal(requiresProfessionalReview('BANK_STATEMENT'), false)
})

test('legal review requires jurisdiction and effective date', () => {
  assert.throws(() => validateReviewEvidence({ type: 'CONTRACT', effectiveDate: new Date() }), /Jurisdiction/)
  assert.throws(() => validateReviewEvidence({ type: 'CONTRACT', jurisdiction: 'US-NY' }), /Effective date/)
  assert.doesNotThrow(() => validateReviewEvidence({ type: 'CONTRACT', jurisdiction: 'US-NY', effectiveDate: new Date() }))
})
