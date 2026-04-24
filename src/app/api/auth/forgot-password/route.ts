import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { parseAndValidateBody } from '@/lib/api-helpers'
import { resetPasswordRequestSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkRateLimit(`forgot-password:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const parsed = await parseAndValidateBody(request, resetPasswordRequestSchema)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiry: expiry,
        },
      })

      // In production, send email with reset link
      // await sendEmail({ to: email, subject: 'Password Reset', body: `Reset link: /reset-password?token=${token}` })
      console.log(`Password reset token for ${email}: ${token}`)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
