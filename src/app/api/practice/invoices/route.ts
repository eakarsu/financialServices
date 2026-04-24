import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateInvoiceNumber } from '@/lib/utils'
import { parsePaginationParams, buildPaginatedResponse } from '@/lib/pagination'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('client')

    const pagination = parsePaginationParams(request, 'createdAt')

    const where: Record<string, unknown> = { firmId: user.firmId }

    if (status && status !== 'all') where.status = status
    if (clientId) where.clientId = clientId

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          client: true,
          createdBy: { select: { firstName: true, lastName: true } },
          lineItems: true,
          payments: true,
        },
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(invoices, total, pagination))
  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const settings = await prisma.firmSettings.findFirst({
      where: { firmId: user.firmId },
    })

    const invoiceNumber = generateInvoiceNumber(
      settings?.invoicePrefix || 'INV',
      settings?.invoiceNextNumber || 1001
    )

    const subtotal = data.lineItems.reduce(
      (sum: number, item: { quantity: number; rate: number }) => sum + (item.quantity * item.rate),
      0
    )
    const taxAmount = subtotal * ((data.taxRate || 0) / 100)
    const total = subtotal + taxAmount

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        firmId: user.firmId,
        clientId: data.clientId,
        createdById: user.id,
        engagementId: data.engagementId || null,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        status: 'DRAFT',
        subtotal,
        taxRate: data.taxRate || 0,
        taxAmount,
        total,
        notes: data.notes,
        terms: data.terms,
        lineItems: {
          create: data.lineItems.map((item: { description: string; quantity: number; rate: number }) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          })),
        },
      },
      include: {
        client: true,
        lineItems: true,
      },
    })

    if (settings) {
      await prisma.firmSettings.update({
        where: { id: settings.id },
        data: { invoiceNextNumber: (settings.invoiceNextNumber || 1001) + 1 },
      })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
