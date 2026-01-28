import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { exportClientsReport } from '@/lib/export'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format, status } = await request.json()

    if (!format || !['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Build query filters
    const where: any = { firmId: user.firmId }
    if (status) {
      where.status = status
    }

    // Get clients
    const clients = await prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    // Get firm name
    const firm = await prisma.firm.findUnique({
      where: { id: user.firmId },
      select: { name: true },
    })

    // Export report
    const buffer = await exportClientsReport(clients, format, {
      firmName: firm?.name,
    })

    // Set response headers
    const filename = `clients-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting clients:', error)
    return NextResponse.json({ error: 'Failed to export clients' }, { status: 500 })
  }
}
