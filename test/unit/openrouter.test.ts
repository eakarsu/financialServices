import assert from 'node:assert/strict'
import test from 'node:test'
import { requestWorkflowReadiness } from '../../src/lib/openrouter'

test('OpenRouter response must include a substantive answer and provider receipt', async () => {
  const originalFetch = globalThis.fetch
  process.env.OPENROUTER_API_KEY = 'test-key'
  process.env.OPENROUTER_MODEL = 'test-model'
  process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
  globalThis.fetch = async (_input, init) => {
    assert.match(String(init?.headers && JSON.stringify(init.headers)), /Bearer test-key/)
    return new Response(JSON.stringify({
      id: 'generation-123',
      model: 'provider/test-model',
      choices: [{ message: { content: 'Require role authorization; retain immutable evidence; obtain documented professional review.' } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  try {
    const evidence = await requestWorkflowReadiness('Client tax-document approval and filing workflow')
    assert.equal(evidence.receipt.provider, 'openrouter')
    assert.equal(evidence.receipt.requestId, 'generation-123')
    assert.match(evidence.result, /immutable evidence/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('OpenRouter integration rejects a non-canonical base URL', async () => {
  process.env.OPENROUTER_BASE_URL = 'https://example.invalid/api/v1'
  await assert.rejects(
    () => requestWorkflowReadiness('Client tax-document approval and filing workflow'),
    /canonical OpenRouter API endpoint/,
  )
})
