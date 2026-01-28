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
    const bankAccountId = searchParams.get('bankAccount')

    if (!bankAccountId) {
      return NextResponse.json({ error: 'Bank account ID required' }, { status: 400 })
    }

    const reconciliations = await prisma.reconciliation.findMany({
      where: { bankAccountId },
      orderBy: { statementDate: 'desc' },
      include: { bankAccount: true },
    })

    return NextResponse.json(reconciliations)
  } catch (error) {
    console.error('Get reconciliations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bankAccountId, statementDate, statementBalance } = await request.json()

    const reconciliation = await prisma.reconciliation.create({
      data: {
        bankAccountId,
        statementDate: new Date(statementDate),
        statementBalance,
        status: 'IN_PROGRESS',
      },
      include: { bankAccount: true },
    })

    return NextResponse.json(reconciliation)
  } catch (error) {
    console.error('Create reconciliation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, transactionIds, clearedBalance, status } = await request.json()

    // Update reconciliation
    const reconciliation = await prisma.reconciliation.update({
      where: { id },
      data: {
        clearedBalance,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    })

    // Mark transactions as reconciled
    if (transactionIds?.length) {
      await prisma.transaction.updateMany({
        where: { id: { in: transactionIds } },
        data: {
          isReconciled: true,
          reconciledAt: new Date(),
        },
      })
    }

    return NextResponse.json(reconciliation)
  } catch (error) {
    console.error('Update reconciliation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
