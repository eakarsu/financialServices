import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'

export function requestContext(request: NextRequest) {
  return {
    requestId: request.headers.get('x-request-id') || randomUUID(),
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  }
}
