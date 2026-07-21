export interface RedactionRange {
  start: number
  end: number
  replacement?: string
}

export function normalizeRedactionRanges(input: unknown, contentLength?: number): RedactionRange[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error('At least one redaction range is required')
  const ranges = input.map((range) => {
    if (!range || typeof range !== 'object') throw new Error('Invalid redaction range')
    const value = range as Record<string, unknown>
    if (!Number.isSafeInteger(value.start) || !Number.isSafeInteger(value.end)) throw new Error('Redaction offsets must be integers')
    const start = value.start as number
    const end = value.end as number
    if (start < 0 || end <= start || (contentLength !== undefined && end > contentLength)) {
      throw new Error('Redaction range is outside the source content')
    }
    const replacement = value.replacement === undefined ? '[REDACTED]' : String(value.replacement)
    if (replacement.length > 100) throw new Error('Redaction replacement is too long')
    return { start, end, replacement }
  }).sort((a, b) => a.start - b.start)
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index].start < ranges[index - 1].end) throw new Error('Redaction ranges cannot overlap')
  }
  return ranges
}

export function applyTextRedactions(content: string, input: unknown): string {
  const ranges = normalizeRedactionRanges(input, content.length)
  let result = ''
  let cursor = 0
  for (const range of ranges) {
    result += content.slice(cursor, range.start)
    result += range.replacement
    cursor = range.end
  }
  result += content.slice(cursor)
  return result
}
