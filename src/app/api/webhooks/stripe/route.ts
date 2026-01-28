import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    const event = constructWebhookEvent(body, signature)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const invoiceNumber = session.client_reference_id

        if (invoiceNumber) {
          // Find and update invoice
          const invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber },
          })

          if (invoice) {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status: 'PAID',
                paidAmount: invoice.total,
                paidAt: new Date(),
              },
            })

            // Create payment record
            await prisma.invoicePayment.create({
              data: {
                invoiceId: invoice.id,
                amount: invoice.total,
                date: new Date(),
                method: 'CREDIT_CARD',
                reference: session.payment_intent as string,
                notes: `Stripe Payment - Session: ${session.id}`,
              },
            })
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const invoiceId = paymentIntent.metadata.invoiceId

        if (invoiceId) {
          const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
          })

          if (invoice) {
            await prisma.invoice.update({
              where: { id: invoiceId },
              data: {
                status: 'PAID',
                paidAmount: invoice.total,
                paidAt: new Date(),
              },
            })

            await prisma.invoicePayment.create({
              data: {
                invoiceId,
                amount: invoice.total,
                date: new Date(),
                method: 'CREDIT_CARD',
                reference: paymentIntent.id,
              },
            })
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.last_payment_error)
        // Handle failed payment
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 })
  }
}
