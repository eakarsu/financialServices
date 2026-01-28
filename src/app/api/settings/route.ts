import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const firmSettings = await prisma.firmSettings.findUnique({
      where: { firmId: user.firmId },
      include: {
        firm: true,
      },
    })

    if (!firmSettings) {
      // Return default settings if none exist
      return NextResponse.json({
        fiscalYearStart: 1,
        defaultHourlyRate: 150,
        invoicePrefix: 'INV',
        invoiceNextNumber: 1001,
        defaultPaymentTerms: 30,
      })
    }

    return NextResponse.json(firmSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const firmSettings = await prisma.firmSettings.upsert({
      where: { firmId: user.firmId },
      update: {
        fiscalYearStart: data.fiscalYearStart,
        defaultHourlyRate: data.defaultHourlyRate,
        invoicePrefix: data.invoicePrefix,
        invoiceNextNumber: data.invoiceNextNumber,
        defaultPaymentTerms: data.defaultPaymentTerms,
      },
      create: {
        firmId: user.firmId,
        fiscalYearStart: data.fiscalYearStart || 1,
        defaultHourlyRate: data.defaultHourlyRate || 150,
        invoicePrefix: data.invoicePrefix || 'INV',
        invoiceNextNumber: data.invoiceNextNumber || 1001,
        defaultPaymentTerms: data.defaultPaymentTerms || 30,
      },
    })

    return NextResponse.json(firmSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
