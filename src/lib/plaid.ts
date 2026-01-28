import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox' // sandbox, development, or production

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)

/**
 * Create a link token for Plaid Link
 */
export async function createLinkToken(userId: string, clientName: string) {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: clientName || 'Financial Services Platform',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
      webhook: `${process.env.NEXTAUTH_URL}/api/webhooks/plaid`,
    })

    return response.data
  } catch (error) {
    console.error('Error creating link token:', error)
    throw error
  }
}

/**
 * Exchange public token for access token
 */
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    }
  } catch (error) {
    console.error('Error exchanging public token:', error)
    throw error
  }
}

/**
 * Get account balances
 */
export async function getAccounts(accessToken: string) {
  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    })

    return response.data.accounts
  } catch (error) {
    console.error('Error getting accounts:', error)
    throw error
  }
}

/**
 * Get transactions
 */
export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 500,
        offset: 0,
      },
    })

    return {
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      totalTransactions: response.data.total_transactions,
    }
  } catch (error) {
    console.error('Error getting transactions:', error)
    throw error
  }
}

/**
 * Sync transactions (for continuous updates)
 */
export async function syncTransactions(accessToken: string, cursor?: string) {
  try {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor,
    })

    return {
      added: response.data.added,
      modified: response.data.modified,
      removed: response.data.removed,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
    }
  } catch (error) {
    console.error('Error syncing transactions:', error)
    throw error
  }
}

/**
 * Get institution information
 */
export async function getInstitution(institutionId: string) {
  try {
    const response = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCode.Us],
    })

    return response.data.institution
  } catch (error) {
    console.error('Error getting institution:', error)
    throw error
  }
}

/**
 * Remove bank account connection
 */
export async function removeItem(accessToken: string) {
  try {
    const response = await plaidClient.itemRemove({
      access_token: accessToken,
    })

    return response.data
  } catch (error) {
    console.error('Error removing item:', error)
    throw error
  }
}

/**
 * Get auth data (account and routing numbers)
 */
export async function getAuthData(accessToken: string) {
  try {
    const response = await plaidClient.authGet({
      access_token: accessToken,
    })

    return {
      accounts: response.data.accounts,
      numbers: response.data.numbers,
    }
  } catch (error) {
    console.error('Error getting auth data:', error)
    throw error
  }
}

/**
 * Create processor token (for integrations)
 */
export async function createProcessorToken(accessToken: string, accountId: string, processor: string) {
  try {
    const response = await plaidClient.processorTokenCreate({
      access_token: accessToken,
      account_id: accountId,
      processor: processor as never,
    })

    return response.data.processor_token
  } catch (error) {
    console.error('Error creating processor token:', error)
    throw error
  }
}
