import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client')

    const where: Record<string, unknown> = {
      client: { firmId: user.firmId },
    }

    if (clientId) where.clientId = clientId

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        client: true,
        lines: {
          include: { account: true },
        },
      },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Get journal entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, date, description, lines, isAdjusting } = await request.json()

    // Generate entry number
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { clientId },
      orderBy: { entryNumber: 'desc' },
    })
    const nextNumber = lastEntry ? parseInt(lastEntry.entryNumber.replace('JE-', '')) + 1 : 1
    const entryNumber = `JE-${nextNumber.toString().padStart(5, '0')}`

    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        clientId,
        date: new Date(date),
        description,
        isAdjusting: isAdjusting || false,
        status: 'DRAFT',
        lines: {
          create: lines.map((line: { accountId: string; debit: number; credit: number; description?: string }) => ({
            accountId: line.accountId,
            debit: line.debit || 0,
            credit: line.credit || 0,
            description: line.description,
          })),
        },
      },
      include: {
        lines: { include: { account: true } },
        client: true,
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Create journal entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
