import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { exportTaxReturnsReport } from '@/lib/export'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format, taxYear, status } = await request.json()

    if (!format || !['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Build query filters
    const where: any = { client: { firmId: user.firmId } }
    if (taxYear) {
      where.taxYear = parseInt(taxYear)
    }
    if (status) {
      where.status = status
    }

    // Get tax returns
    const taxReturns = await prisma.taxReturn.findMany({
      where,
      include: {
        client: { select: { businessName: true, firstName: true, lastName: true } },
      },
      orderBy: [{ taxYear: 'desc' }, { dueDate: 'desc' }],
    })

    // Get firm name
    const firm = await prisma.firm.findUnique({
      where: { id: user.firmId },
      select: { name: true },
    })

    // Export report
    const buffer = await exportTaxReturnsReport(taxReturns, format, {
      firmName: firm?.name,
    })

    // Set response headers
    const filename = `tax-returns-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting tax returns:', error)
    return NextResponse.json({ error: 'Failed to export tax returns' }, { status: 500 })
  }
}
