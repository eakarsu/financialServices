import test from 'node:test'
import assert from 'node:assert/strict'
import { collectionFromResponse } from '../../src/lib/api-response'

test('collectionFromResponse accepts direct API arrays', () => {
  const records = [{ id: 'one' }, { id: 'two' }]
  assert.deepEqual(collectionFromResponse(records), records)
})

test('collectionFromResponse unwraps paginated API data', () => {
  const records = [{ id: 'one' }]
  assert.deepEqual(
    collectionFromResponse({ data: records, pagination: { page: 1, total: 1 } }),
    records
  )
})

test('collectionFromResponse safely rejects non-collection payloads', () => {
  assert.deepEqual(collectionFromResponse({ error: 'Unauthorized' }), [])
  assert.deepEqual(collectionFromResponse(null), [])
})
