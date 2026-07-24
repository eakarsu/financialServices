import { requireConfig } from './secrets'

const CANONICAL_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

interface OpenRouterResponse {
  id?: unknown
  model?: unknown
  choices?: Array<{ message?: { content?: unknown } }>
}

export interface OpenRouterEvidence {
  result: string
  receipt: {
    provider: 'openrouter'
    requestId: string
    model: string
    completedAt: string
  }
}

export async function requestWorkflowReadiness(workflow: string): Promise<OpenRouterEvidence> {
  const configuredBaseUrl = process.env.OPENROUTER_BASE_URL || CANONICAL_OPENROUTER_BASE_URL
  if (configuredBaseUrl.replace(/\/$/, '') !== CANONICAL_OPENROUTER_BASE_URL) {
    throw new Error('OPENROUTER_BASE_URL must use the canonical OpenRouter API endpoint')
  }

  const model = requireConfig('OPENROUTER_MODEL')
  const response = await fetch(`${CANONICAL_OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireConfig('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_BASE_URL || 'http://127.0.0.1',
      'X-Title': 'Financial Services Legal Workflow Readiness',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are a financial-services compliance operations assistant. Give concise, concrete controls. Do not provide legal advice or invent evidence.',
        },
        {
          role: 'user',
          content: `Assess this financial document workflow for operational readiness: ${workflow}. Return exactly three short controls covering authorization, evidence retention, and professional review.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  })

  const payload = await response.json().catch(() => null) as OpenRouterResponse | null
  if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}`)

  const requestId = typeof payload?.id === 'string' ? payload.id.trim() : ''
  const providerModel = typeof payload?.model === 'string' ? payload.model.trim() : ''
  const result = typeof payload?.choices?.[0]?.message?.content === 'string'
    ? payload.choices[0].message.content.trim()
    : ''
  if (!requestId || !providerModel || result.length < 40) {
    throw new Error('OpenRouter response did not include substantive provider evidence')
  }

  return {
    result,
    receipt: {
      provider: 'openrouter',
      requestId,
      model: providerModel,
      completedAt: new Date().toISOString(),
    },
  }
}
