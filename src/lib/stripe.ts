import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

export interface PaymentIntentOptions {
  amount: number // in cents
  currency?: string
  customerId?: string
  invoiceId: string
  clientEmail: string
  description?: string
}

/**
 * Create a payment intent for invoice payment
 */
export async function createPaymentIntent(options: PaymentIntentOptions): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(options.amount * 100), // Convert to cents
    currency: options.currency || 'usd',
    customer: options.customerId,
    receipt_email: options.clientEmail,
    description: options.description || `Payment for Invoice #${options.invoiceId}`,
    metadata: {
      invoiceId: options.invoiceId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return paymentIntent
}

/**
 * Create or retrieve a Stripe customer
 */
export async function createOrGetCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  // Check if customer exists
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name,
    metadata,
  })
}

/**
 * Create a checkout session for invoice payment
 */
export async function createCheckoutSession(
  invoiceId: string,
  amount: number,
  clientEmail: string,
  clientName: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice #${invoiceId}`,
            description: 'Professional services',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer_email: clientEmail,
    client_reference_id: invoiceId,
    metadata: {
      invoiceId,
      clientName,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session
}

/**
 * Refund a payment
 */
export async function refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  })
}

/**
 * Retrieve payment intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

/**
 * List all charges for a customer
 */
export async function getCustomerCharges(customerId: string, limit = 10): Promise<Stripe.Charge[]> {
  const charges = await stripe.charges.list({
    customer: customerId,
    limit,
  })
  return charges.data
}

/**
 * Create a subscription for recurring billing
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
  })
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Construct webhook event from request
 */
export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
}

/**
 * Create a payment link for an invoice
 */
export async function createPaymentLink(
  invoiceId: string,
  amount: number,
  description: string
): Promise<Stripe.PaymentLink> {
  const product = await stripe.products.create({
    name: `Invoice #${invoiceId}`,
    description,
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(amount * 100),
    currency: 'usd',
  })

  return await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId,
    },
  })
}
