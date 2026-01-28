import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { syncTransactions } from '@/lib/plaid'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bankAccountId } = await request.json()

    // Get bank account with Plaid credentials
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: { client: true },
    })

    if (!bankAccount || !bankAccount.plaidAccessToken) {
      return NextResponse.json({ error: 'Bank account not found or not connected' }, { status: 404 })
    }

    // Sync transactions
    const result = await syncTransactions(bankAccount.plaidAccessToken)

    // Process added transactions
    for (const tx of result.added) {
      await prisma.transaction.create({
        data: {
          clientId: bankAccount.clientId,
          bankAccountId: bankAccount.id,
          date: new Date(tx.date),
          description: tx.name,
          amount: Math.abs(tx.amount),
          type: tx.amount > 0 ? 'CREDIT' : 'DEBIT',
          status: 'PENDING',
          vendor: tx.merchant_name || undefined,
          originalDescription: tx.original_description || undefined,
        },
      })
    }

    // Update bank account sync timestamp
    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { lastSyncedAt: new Date() },
    })

    return NextResponse.json({
      added: result.added.length,
      modified: result.modified.length,
      removed: result.removed.length,
      hasMore: result.hasMore,
    })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json({ error: 'Failed to sync transactions' }, { status: 500 })
  }
}
