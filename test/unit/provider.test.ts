import { createHmac } from 'crypto'
import { createServer } from 'http'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  callDocumentProvider,
  validSignatureTransition,
  verifyProviderWebhook,
} from '../../src/lib/providers/document-provider'
import { sha256 } from '../../src/lib/documents'

test('provider webhook verification uses HMAC and constant-shape signatures', () => {
  const body = '{"event":"signed"}'
  const secret = 'provider-webhook-secret-that-is-long-enough'
  const signature = createHmac('sha256', secret).update(body).digest('hex')
  assert.equal(verifyProviderWebhook(body, signature, secret), true)
  assert.equal(verifyProviderWebhook(`${body}x`, signature, secret), false)
  assert.equal(verifyProviderWebhook(body, 'bad', secret), false)
})

test('signature state machine rejects terminal reversal', () => {
  assert.equal(validSignatureTransition('PENDING', 'VIEWED'), true)
  assert.equal(validSignatureTransition('VIEWED', 'SIGNED'), true)
  assert.equal(validSignatureTransition('SIGNED', 'PENDING'), false)
  assert.equal(validSignatureTransition('FAILED', 'SIGNED'), false)
})

test('licensed provider evidence is accepted and bound to source checksum', async () => {
  const content = Buffer.from('document evidence')
  const checksum = sha256(content)
  const server = createServer((request, response) => {
    assert.equal(request.headers.authorization, 'Bearer provider-token')
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      licensed: true, provider: 'test-ocr', eventId: 'event-1', sourceTimestamp: '2026-07-19T12:00:00.000Z',
      sourceSha256: checksum, status: 'COMPLETED', result: { text: 'document evidence', confidence: 1, pageCount: 1 },
    }))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  process.env.OCR_PROVIDER_URL = `http://127.0.0.1:${address.port}`
  process.env.OCR_PROVIDER_TOKEN = 'provider-token'
  try {
    const evidence = await callDocumentProvider({ operation: 'ocr', sourceSha256: checksum, content, metadata: {} })
    assert.equal(evidence.provider, 'test-ocr')
    assert.equal(evidence.sourceSha256, checksum)
    assert.match(evidence.payloadDigest, /^[a-f0-9]{64}$/)
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

test('provider checksum mismatch fails closed', async () => {
  const content = Buffer.from('document evidence')
  const server = createServer((_request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      licensed: true, provider: 'test-ocr', eventId: 'event-2', sourceTimestamp: '2026-07-19T12:00:00.000Z',
      sourceSha256: '0'.repeat(64), status: 'COMPLETED', result: {},
    }))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  process.env.OCR_PROVIDER_URL = `http://127.0.0.1:${address.port}`
  process.env.OCR_PROVIDER_TOKEN = 'provider-token'
  try {
    await assert.rejects(() => callDocumentProvider({ operation: 'ocr', sourceSha256: sha256(content), content, metadata: {} }), /checksum/)
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
