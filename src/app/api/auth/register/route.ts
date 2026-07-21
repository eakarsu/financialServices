import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { parseAndValidateBody } from '@/lib/api-helpers'
import { registerSchema } from '@/lib/validation'
import { createOpaqueToken, tokenDigest } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { requireConfig } from '@/lib/secrets'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkRateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const parsed = await parseAndValidateBody(request, registerSchema)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { email, password, firstName, lastName, firmName } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const emailVerificationToken = createOpaqueToken()
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const firm = await prisma.firm.create({
      data: {
        name: firmName,
        email: email,
      },
    })

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
        firmId: firm.id,
        emailVerified: false,
        emailVerificationToken: tokenDigest(emailVerificationToken),
        emailVerificationExpiry,
      },
      include: { firm: true },
    })

    // Create default chart of accounts for the firm
    const defaultAccounts = [
      { accountNumber: '1000', name: 'Cash', type: 'ASSET' as const, subType: 'Current Asset' },
      { accountNumber: '1100', name: 'Accounts Receivable', type: 'ASSET' as const, subType: 'Current Asset' },
      { accountNumber: '1200', name: 'Inventory', type: 'ASSET' as const, subType: 'Current Asset' },
      { accountNumber: '1500', name: 'Fixed Assets', type: 'ASSET' as const, subType: 'Fixed Asset' },
      { accountNumber: '2000', name: 'Accounts Payable', type: 'LIABILITY' as const, subType: 'Current Liability' },
      { accountNumber: '2100', name: 'Credit Cards', type: 'LIABILITY' as const, subType: 'Current Liability' },
      { accountNumber: '2500', name: 'Long-term Liabilities', type: 'LIABILITY' as const, subType: 'Long-term Liability' },
      { accountNumber: '3000', name: 'Owner\'s Equity', type: 'EQUITY' as const, subType: 'Owner\'s Equity' },
      { accountNumber: '3100', name: 'Retained Earnings', type: 'EQUITY' as const, subType: 'Retained Earnings' },
      { accountNumber: '4000', name: 'Sales Revenue', type: 'REVENUE' as const, subType: 'Operating Revenue' },
      { accountNumber: '4100', name: 'Service Revenue', type: 'REVENUE' as const, subType: 'Operating Revenue' },
      { accountNumber: '4500', name: 'Other Income', type: 'REVENUE' as const, subType: 'Other Income' },
      { accountNumber: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' as const, subType: 'Cost of Sales' },
      { accountNumber: '6000', name: 'Payroll Expense', type: 'EXPENSE' as const, subType: 'Operating Expense' },
      { accountNumber: '6100', name: 'Rent Expense', type: 'EXPENSE' as const, subType: 'Operating Expense' },
      { accountNumber: '6200', name: 'Utilities Expense', type: 'EXPENSE' as const, subType: 'Operating Expense' },
      { accountNumber: '6300', name: 'Office Supplies', type: 'EXPENSE' as const, subType: 'Operating Expense' },
      { accountNumber: '6400', name: 'Insurance Expense', type: 'EXPENSE' as const, subType: 'Operating Expense' },
      { accountNumber: '6500', name: 'Professional Fees', type: 'EXPENSE' as const, subType: 'Operating Expense' },
      { accountNumber: '6900', name: 'Other Expenses', type: 'EXPENSE' as const, subType: 'Other Expense' },
    ]

    await prisma.chartOfAccount.createMany({
      data: defaultAccounts.map(acc => ({
        ...acc,
        firmId: firm.id,
      })),
    })

    // Create firm settings
    await prisma.firmSettings.create({
      data: {
        firmId: firm.id,
      },
    })

    await sendEmail({
      to: email,
      subject: 'Verify your email',
      text: `Verify your account: ${requireConfig('APP_BASE_URL')}/verify-email?token=${encodeURIComponent(emailVerificationToken)}`,
    })

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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
