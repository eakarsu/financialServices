export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return sanitizeString(obj) as T
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizeObject) as T

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    sanitized[key] = sanitizeObject(value)
  }
  return sanitized as T
}
