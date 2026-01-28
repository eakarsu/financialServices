import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id },
      include: {
        client: true,
        transactions: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!bankAccount) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
    }

    return NextResponse.json(bankAccount)
  } catch (error) {
    console.error('Error fetching bank account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const bankAccount = await prisma.bankAccount.update({
      where: { id },
      data: {
        name: data.name,
        accountType: data.accountType,
        institution: data.institution,
        accountNumber: data.accountNumber,
        routingNumber: data.routingNumber,
        balance: data.balance,
      },
    })

    return NextResponse.json(bankAccount)
  } catch (error) {
    console.error('Error updating bank account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if there are transactions associated with this account
    const transactionCount = await prisma.transaction.count({
      where: { bankAccountId: id },
    })

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete bank account with existing transactions' },
        { status: 400 }
      )
    }

    await prisma.bankAccount.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bank account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
