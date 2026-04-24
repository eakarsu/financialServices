import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { parseAndValidateBody } from '@/lib/api-helpers'
import { loginSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkRateLimit(`login:${ip}`, { maxRequests: 10, windowMs: 15 * 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const parsed = await parseAndValidateBody(request, loginSchema)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
      include: { firm: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      )
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firm: user.firm,
      },
    })

    response.headers.set('Set-Cookie', setAuthCookie(token)['Set-Cookie'])

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
