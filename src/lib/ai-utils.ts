/**
 * Shared AI utilities used across all AI endpoints.
 *
 * - Standard model: anthropic/claude-3-5-sonnet-20241022
 * - aiRateLimiter: 20/hr per user
 * - parseAIJson: 3-strategy parser (raw -> fenced -> first {/[ block)
 * - logAIResult: persist input/output to AIAnalysis (ai_results-style JSONB log)
 */

import prisma from './prisma'
import { checkRateLimit } from './rate-limit'

export const AI_MODEL =
  process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022'

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

/**
 * Per-user AI rate limiter: 20 calls per hour.
 */
export function aiRateLimiter(userId: string) {
  return checkRateLimit(`ai:${userId}`, {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  })
}

/**
 * 3-strategy JSON parser:
 *   1. Try direct JSON.parse on the raw response.
 *   2. Try to extract a fenced ```json ... ``` block.
 *   3. Try to extract the first `{...}` or `[...]` block via regex.
 *
 * Returns null if all strategies fail.
 */
export function parseAIJson<T = unknown>(text: string): T | null {
  if (!text || typeof text !== 'string') return null

  // Strategy 1: direct parse
  try {
    return JSON.parse(text) as T
  } catch {
    // continue
  }

  // Strategy 2: fenced code block
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1]) as T
    } catch {
      // continue
    }
  }

  // Strategy 3: first JSON object/array
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]) as T
    } catch {
      // continue
    }
  }
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]) as T
    } catch {
      // continue
    }
  }

  return null
}

/**
 * Call OpenRouter chat completions with consistent headers + the standardised model.
 */
export async function callOpenRouter(
  prompt: string,
  systemPrompt?: string,
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured')
  }

  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'X-Title': 'Financial Services AI Platform',
    },
    body: JSON.stringify({
      model: options.model || AI_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Log an AI call to the AIAnalysis table (ai_results-style JSONB log).
 * Failures here are swallowed — logging must never block the user response.
 */
export async function logAIResult(params: {
  type: string
  input: unknown
  output: unknown
  confidence?: number
  status?: 'COMPLETED' | 'FAILED' | 'PENDING'
  processingTime?: number
}): Promise<void> {
  try {
    await prisma.aIAnalysis.create({
      data: {
        type: params.type as never,
        input: params.input as never,
        output: params.output as never,
        confidence: params.confidence ?? null,
        status: (params.status || 'COMPLETED') as never,
        processingTime: params.processingTime ?? null,
      },
    })
  } catch (err) {
    console.error('Failed to log AI result:', err)
  }
}
