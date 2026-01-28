import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const taxReturn = await prisma.taxReturn.findFirst({
      where: {
        id,
        client: { firmId: user.firmId },
      },
      include: {
        client: true,
        organizer: true,
        checklistItems: { orderBy: { category: 'asc' } },
        estimates: { orderBy: { quarter: 'asc' } },
      },
    })

    if (!taxReturn) {
      return NextResponse.json({ error: 'Tax return not found' }, { status: 404 })
    }

    return NextResponse.json(taxReturn)
  } catch (error) {
    console.error('Get tax return error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const taxReturn = await prisma.taxReturn.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        extendedDueDate: data.extendedDueDate ? new Date(data.extendedDueDate) : undefined,
        filedDate: data.filedDate ? new Date(data.filedDate) : undefined,
        acceptedDate: data.acceptedDate ? new Date(data.acceptedDate) : undefined,
      },
      include: {
        client: true,
        organizer: true,
        checklistItems: true,
        estimates: true,
      },
    })

    return NextResponse.json(taxReturn)
  } catch (error) {
    console.error('Update tax return error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
