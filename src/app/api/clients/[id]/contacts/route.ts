import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
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

    const client = await prisma.client.findFirst({
      where: { id, firmId: user.firmId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // If this contact is primary, remove primary from others
    if (data.isPrimary) {
      await prisma.clientContact.updateMany({
        where: { clientId: id },
        data: { isPrimary: false },
      })
    }

    const contact = await prisma.clientContact.create({
      data: {
        ...data,
        clientId: id,
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
