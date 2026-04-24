import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { exchangePublicToken, getAccounts } from '@/lib/plaid'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { publicToken, clientId } = await request.json()

    // Exchange public token for access token
    const { accessToken, itemId } = await exchangePublicToken(publicToken)

    // Get account information
    const accounts = await getAccounts(accessToken)

    // Save bank accounts to database
    const createdAccounts = await Promise.all(
      accounts.map(async (account) => {
        return await prisma.bankAccount.create({
          data: {
            clientId,
            name: account.name,
            accountType: mapPlaidAccountType(account.type),
            balance: account.balances.current || 0,
            institution: account.official_name || account.name,
            plaidAccessToken: accessToken,
            plaidItemId: itemId,
            plaidAccountId: account.account_id,
            isActive: true,
            lastSyncedAt: new Date(),
          },
        })
      })
    )

    return NextResponse.json({ accounts: createdAccounts })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 })
  }
}

function mapPlaidAccountType(plaidType: string): 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'OTHER' {
  const typeMap: Record<string, 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'OTHER'> = {
    depository: 'CHECKING',
    credit: 'CREDIT_CARD',
    loan: 'LOAN',
    investment: 'INVESTMENT',
  }
  return typeMap[plaidType] || 'OTHER'
}
