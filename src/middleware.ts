import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Env-driven CORS allowlist (comma-separated origins). An empty list denies
// cross-origin API access.
function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS || ''
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

function originAllowed(origin: string | null, allowed: string[]): string | null {
  if (!origin) return null
  if (allowed.length === 0) return null
  if (allowed.includes('*')) return '*'
  if (allowed.includes(origin)) return origin
  return null
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const origin = request.headers.get('origin')
  const allowed = getAllowedOrigins()
  const allowOrigin = originAllowed(origin, allowed)

  // Helmet-equivalent security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('Origin-Agent-Cluster', '?1')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.plaid.com`
  )

  // CORS — only for /api routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (allowOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowOrigin)
      response.headers.set('Vary', 'Origin')
    }
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    )
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
