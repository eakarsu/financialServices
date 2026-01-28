import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createCheckoutSession, createOrGetCustomer } from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId } = await request.json()

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const clientName = invoice.client.businessName ||
      `${invoice.client.firstName} ${invoice.client.lastName}`

    // Create or get Stripe customer
    const customer = await createOrGetCustomer(
      invoice.client.email!,
      clientName,
      { clientId: invoice.client.id }
    )

    // Create checkout session
    const session = await createCheckoutSession(
      invoice.invoiceNumber,
      parseFloat(invoice.total.toString()),
      invoice.client.email!,
      clientName,
      `${process.env.NEXTAUTH_URL}/dashboard/practice?payment=success&invoice=${invoice.id}`,
      `${process.env.NEXTAUTH_URL}/dashboard/practice?payment=cancelled&invoice=${invoice.id}`
    )

    // Update invoice with Stripe session info
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        notes: `Stripe Checkout Session: ${session.id}`,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Payment checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
