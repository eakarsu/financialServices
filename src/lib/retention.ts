export type RetentionDecision = 'ACTIVE' | 'ELIGIBLE' | 'BLOCKED_BY_HOLD' | 'DISPOSED'

export function retentionDecision(input: {
  current: RetentionDecision
  retainUntil: Date | null
  activeHoldCount: number
  now?: Date
}): RetentionDecision {
  if (input.current === 'DISPOSED') return 'DISPOSED'
  if (input.activeHoldCount > 0) return 'BLOCKED_BY_HOLD'
  if (input.retainUntil && input.retainUntil <= (input.now || new Date())) return 'ELIGIBLE'
  return 'ACTIVE'
}
