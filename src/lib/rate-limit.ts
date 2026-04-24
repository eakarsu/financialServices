interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  })
}, 5 * 60 * 1000)

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }

  entry.count++
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const resetIn = entry.resetAt - now

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn }
  }

  return { allowed: true, remaining, resetIn }
}
