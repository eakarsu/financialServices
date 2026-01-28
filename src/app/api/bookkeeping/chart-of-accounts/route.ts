import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: { firmId: user.firmId, isActive: true },
      orderBy: { accountNumber: 'asc' },
      include: {
        parent: true,
        children: true,
      },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Get chart of accounts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const account = await prisma.chartOfAccount.create({
      data: {
        ...data,
        firmId: user.firmId,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Create account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
