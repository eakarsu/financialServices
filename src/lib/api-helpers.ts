import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sanitizeObject } from './sanitize'

export async function parseAndValidateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const raw = await request.json()
    const sanitized = sanitizeObject(raw)
    const result = schema.safeParse(sanitized)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return { success: false, error: firstError.message }
    }

    return { success: true, data: result.data }
  } catch {
    return { success: false, error: 'Invalid request body' }
  }
}
