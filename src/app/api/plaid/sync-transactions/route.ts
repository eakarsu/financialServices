import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { syncTransactions } from '@/lib/plaid'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { bankAccountId } = await request.json()
    if (typeof bankAccountId !== 'string') return NextResponse.json({ error: 'bankAccountId is required' }, { status: 400 })
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, client: { firmId: user.firmId } },
    })
    if (!bankAccount?.plaidAccessToken) return NextResponse.json({ error: 'Connected bank account not found' }, { status: 404 })

    const result = await syncTransactions(bankAccount.plaidAccessToken)
    let created = 0
    let updated = 0
    await prisma.$transaction(async (tx) => {
      for (const source of [...result.added, ...result.modified]) {
        const existing = await tx.transaction.findFirst({
          where: { bankAccountId: bankAccount.id, reference: source.transaction_id },
        })
        const data = {
          clientId: bankAccount.clientId,
          bankAccountId: bankAccount.id,
          date: new Date(source.date),
          description: source.name,
          amount: Math.abs(source.amount),
          type: source.amount >= 0 ? 'DEBIT' as const : 'CREDIT' as const,
          status: 'PENDING' as const,
          reference: source.transaction_id,
          vendor: source.merchant_name || undefined,
          originalDescription: source.original_description || undefined,
        }
        if (existing) {
          await tx.transaction.update({ where: { id: existing.id }, data })
          updated += 1
        } else {
          await tx.transaction.create({ data })
          created += 1
        }
      }
      for (const removed of result.removed) {
        await tx.transaction.updateMany({
          where: { bankAccountId: bankAccount.id, reference: removed.transaction_id },
          data: { status: 'EXCLUDED', memo: 'Removed by licensed bank-data provider' },
        })
      }
      await tx.bankAccount.update({ where: { id: bankAccount.id }, data: { lastSyncedAt: new Date() } })
    })
    return NextResponse.json({ created, updated, removed: result.removed.length, hasMore: result.hasMore })
  } catch (error) {
    console.error('Transaction sync error:', error)
    return NextResponse.json({ error: 'Transaction sync failed' }, { status: 502 })
  }
}
