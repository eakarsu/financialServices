import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

// Stripe requires the raw body — disable body parsing via config
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let rawBody: Buffer
  try {
    const arrayBuffer = await request.arrayBuffer()
    rawBody = Buffer.from(arrayBuffer)
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(
          `PaymentIntent failed for invoice ${paymentIntent.metadata?.invoiceId}: ${paymentIntent.last_payment_error?.message}`
        )
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status === 'paid' && session.payment_intent) {
          // Resolve the PaymentIntent ID to the full object then handle it
          const piId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent.id
          // Re-use the same handler: fetch from metadata stored on the session
          const invoiceId =
            session.metadata?.invoiceId || session.client_reference_id
          if (invoiceId && session.amount_total) {
            await recordPaymentOnInvoice(
              invoiceId,
              session.amount_total / 100,
              piId
            )
          }
        }
        break
      }

      case 'invoice.paid': {
        // Stripe subscription invoice paid
        const stripeInvoice = event.data.object as Stripe.Invoice
        console.log(`Stripe subscription invoice paid: ${stripeInvoice.id}`)
        break
      }

      default:
        // Unhandled event — acknowledge receipt
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata?.invoiceId
  if (!invoiceId) {
    console.warn('payment_intent.succeeded: no invoiceId in metadata', paymentIntent.id)
    return
  }

  const amountPaid = paymentIntent.amount_received / 100
  await recordPaymentOnInvoice(invoiceId, amountPaid, paymentIntent.id)
}

async function recordPaymentOnInvoice(
  invoiceId: string,
  amountPaid: number,
  paymentIntentId: string
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  })

  if (!invoice) {
    console.error(`Invoice ${invoiceId} not found for payment recording`)
    return
  }

  // Record the payment
  await prisma.invoicePayment.create({
    data: {
      invoiceId,
      amount: amountPaid,
      date: new Date(),
      method: 'CREDIT_CARD',
      reference: paymentIntentId,
      notes: `Stripe PaymentIntent: ${paymentIntentId}`,
    },
  })

  // Calculate new paid amount
  const newPaidAmount = parseFloat(invoice.paidAmount.toString()) + amountPaid
  const total = parseFloat(invoice.total.toString())
  const newStatus = newPaidAmount >= total ? 'PAID' : 'PARTIAL'

  // Update invoice status and paid amount
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus,
      paidAt: newStatus === 'PAID' ? new Date() : undefined,
    },
  })

  console.log(
    `Invoice ${invoiceId} updated: paid $${amountPaid}, status → ${newStatus}`
  )
}
