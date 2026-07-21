import Stripe from 'stripe'
import { requireSecret } from './secrets'

let stripeClient: Stripe | undefined

export function getStripeClient(): Stripe {
  stripeClient ??= new Stripe(requireSecret('STRIPE_SECRET_KEY', 16), {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  })
  return stripeClient
}

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
  const paymentIntent = await getStripeClient().paymentIntents.create({
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
  const existingCustomers = await getStripeClient().customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  return await getStripeClient().customers.create({
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
  const session = await getStripeClient().checkout.sessions.create({
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
  return await getStripeClient().refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  })
}

/**
 * Retrieve payment intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await getStripeClient().paymentIntents.retrieve(paymentIntentId)
}

/**
 * List all charges for a customer
 */
export async function getCustomerCharges(customerId: string, limit = 10): Promise<Stripe.Charge[]> {
  const charges = await getStripeClient().charges.list({
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
  return await getStripeClient().subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
  })
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await getStripeClient().subscriptions.cancel(subscriptionId)
}

/**
 * Construct webhook event from request
 */
export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  return getStripeClient().webhooks.constructEvent(payload, signature, requireSecret('STRIPE_WEBHOOK_SECRET', 16))
}

/**
 * Create a payment link for an invoice
 */
export async function createPaymentLink(
  invoiceId: string,
  amount: number,
  description: string
): Promise<Stripe.PaymentLink> {
  const product = await getStripeClient().products.create({
    name: `Invoice #${invoiceId}`,
    description,
  })

  const price = await getStripeClient().prices.create({
    product: product.id,
    unit_amount: Math.round(amount * 100),
    currency: 'usd',
  })

  return await getStripeClient().paymentLinks.create({
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
