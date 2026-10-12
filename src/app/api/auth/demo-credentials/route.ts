import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { resolveDemoPassword } from '@/lib/demo-credentials'

export const dynamic = 'force-dynamic'

export async function GET() {
  const explicitlyDisabled = process.env.ENABLE_DEMO_CREDENTIALS === '0'
  const explicitlyEnabled = process.env.ENABLE_DEMO_CREDENTIALS === '1'
  const enabledForLocalDevelopment = process.env.NODE_ENV !== 'production'
  const password = resolveDemoPassword()
  const email = process.env.DEMO_EMAIL || process.env.DEMO_ADMIN_EMAIL || 'admin@example.com'
  const unavailable = () => NextResponse.json(
    { error: 'A configured, active demo account is unavailable in this environment' },
    { status: 404, headers: { 'Cache-Control': 'no-store' } }
  )

  if (
    explicitlyDisabled ||
    (!explicitlyEnabled && !enabledForLocalDevelopment) ||
    password.length < 12
  ) {
    return unavailable()
  }

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { password: true, isActive: true } })
    if (!user?.isActive || !(await bcrypt.compare(password, user.password))) return unavailable()
  } catch {
    return unavailable()
  }

  return NextResponse.json(
    {
      email,
      password,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
