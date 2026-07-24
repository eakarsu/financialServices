import { NextResponse } from 'next/server'
import { provisionDemoUsers, resolveDemoPassword } from '@/lib/demo-credentials'

export const dynamic = 'force-dynamic'

export async function GET() {
  const explicitlyDisabled = process.env.ENABLE_DEMO_CREDENTIALS === '0'
  const explicitlyEnabled = process.env.ENABLE_DEMO_CREDENTIALS === '1'
  const enabledForLocalDevelopment = process.env.NODE_ENV !== 'production'
  const password = resolveDemoPassword()

  if (
    explicitlyDisabled ||
    (!explicitlyEnabled && !enabledForLocalDevelopment) ||
    password.length < 12
  ) {
    return NextResponse.json(
      { error: 'Demo credentials are not configured for this environment' },
      {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }

  await provisionDemoUsers(password)

  return NextResponse.json(
    {
      email: 'admin@example.com',
      password,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
