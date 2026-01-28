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

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        user: true,
        engagement: {
          include: { client: true },
        },
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error('Error fetching time entry:', error)
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

    // Calculate amount if billable
    const amount = data.isBillable && data.rate ? data.hours * data.rate : null

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        hours: data.hours,
        description: data.description,
        isBillable: data.isBillable,
        rate: data.isBillable ? data.rate : null,
        amount,
        status: data.status,
        engagementId: data.engagementId || null,
      },
      include: {
        user: true,
        engagement: {
          include: { client: true },
        },
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if time entry is already billed
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (timeEntry?.status === 'BILLED') {
      return NextResponse.json(
        { error: 'Cannot delete a billed time entry' },
        { status: 400 }
      )
    }

    await prisma.timeEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
