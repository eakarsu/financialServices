import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createPaymentIntent, createOrGetCustomer } from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId, billId } = await request.json()

    if (!invoiceId && !billId) {
      return NextResponse.json(
        { error: 'invoiceId or billId is required' },
        { status: 400 }
      )
    }

    // Look up the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, firm: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Ensure invoice belongs to the user's firm
    if (invoice.firmId !== user.firmId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (invoice.status === 'PAID' || invoice.status === 'VOID') {
      return NextResponse.json(
        { error: `Invoice is already ${invoice.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    const clientEmail = invoice.client.email || invoice.client.billingEmail
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client has no email address on file' },
        { status: 400 }
      )
    }

    const clientName =
      invoice.client.businessName ||
      `${invoice.client.firstName ?? ''} ${invoice.client.lastName ?? ''}`.trim() ||
      'Client'

    // Remaining balance (total - already paid)
    const amountDue =
      parseFloat(invoice.total.toString()) -
      parseFloat(invoice.paidAmount.toString())

    if (amountDue <= 0) {
      return NextResponse.json(
        { error: 'Invoice has no outstanding balance' },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    const customer = await createOrGetCustomer(clientEmail, clientName, {
      clientId: invoice.clientId,
      firmId: invoice.firmId,
    })

    // Create the PaymentIntent
    const paymentIntent = await createPaymentIntent({
      amount: amountDue,
      currency: 'usd',
      customerId: customer.id,
      invoiceId: invoice.id,
      clientEmail,
      description: `Payment for Invoice ${invoice.invoiceNumber}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountDue,
      currency: paymentIntent.currency,
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
