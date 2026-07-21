import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createOrGetCustomer, createSubscription, getStripeClient } from '@/lib/stripe'
import prisma from '@/lib/prisma'

/**
 * POST /api/subscriptions/create
 *
 * Creates a Stripe subscription for recurring billing of a client.
 *
 * Body:
 *   clientId    – the firm's client to bill
 *   priceId     – Stripe Price ID (recurring) — must be created in Stripe dashboard
 *   engagementId – (optional) associate with an engagement
 *
 * OR pass `amount` + `interval` + `intervalCount` to dynamically create a price:
 *   amount       – monthly/annual amount in dollars
 *   interval     – "month" | "year" | "week" | "day"
 *   intervalCount – number of intervals between billings (default 1)
 *   description  – product description shown on Stripe
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      clientId,
      priceId: existingPriceId,
      engagementId,
      amount,
      interval = 'month',
      intervalCount = 1,
      description = 'Recurring accounting services',
    } = body

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }
    if (!existingPriceId && !amount) {
      return NextResponse.json(
        { error: 'Either priceId or amount is required' },
        { status: 400 }
      )
    }

    // Verify client belongs to this firm
    const client = await prisma.client.findFirst({
      where: { id: clientId, firmId: user.firmId },
    })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientEmail = client.email || client.billingEmail
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client has no email address on file' },
        { status: 400 }
      )
    }

    const clientName =
      client.businessName ||
      `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() ||
      'Client'

    // Create or retrieve Stripe customer
    const customer = await createOrGetCustomer(clientEmail, clientName, {
      clientId,
      firmId: user.firmId,
    })

    // Resolve the Stripe Price ID
    let priceId = existingPriceId
    if (!priceId) {
      // Dynamically create a product + price for this recurring billing
      const product = await getStripeClient().products.create({
        name: `${clientName} — Recurring Services`,
        description,
        metadata: { clientId, firmId: user.firmId },
      })

      const price = await getStripeClient().prices.create({
        product: product.id,
        unit_amount: Math.round(Number(amount) * 100),
        currency: 'usd',
        recurring: {
          interval: interval as 'day' | 'week' | 'month' | 'year',
          interval_count: intervalCount,
        },
        metadata: { clientId, firmId: user.firmId },
      })

      priceId = price.id
    }

    // Create the subscription
    const subscription = await createSubscription(customer.id, priceId, {
      clientId,
      firmId: user.firmId,
      ...(engagementId ? { engagementId } : {}),
    })

    // Record the integration in the DB (upsert so we don't duplicate)
    await prisma.integration.upsert({
      where: {
        // There is a unique constraint on (firmId, type) if we add one — fall back to create
        id: `stripe-${user.firmId}`,
      },
      update: {
        status: 'CONNECTED',
        settings: {
          customerId: customer.id,
          subscriptionId: subscription.id,
          priceId,
        },
        lastSyncAt: new Date(),
      },
      create: {
        id: `stripe-${user.firmId}`,
        firmId: user.firmId,
        type: 'STRIPE',
        name: 'Stripe Billing',
        status: 'CONNECTED',
        settings: {
          customerId: customer.id,
          subscriptionId: subscription.id,
          priceId,
        },
        lastSyncAt: new Date(),
      },
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      priceId,
      status: subscription.status,
      currentPeriodStart: new Date(
        (subscription as unknown as { current_period_start: number }).current_period_start * 1000
      ),
      currentPeriodEnd: new Date(
        (subscription as unknown as { current_period_end: number }).current_period_end * 1000
      ),
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
