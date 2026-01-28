import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceItems = await prisma.serviceItem.findMany({
      where: {
        firmId: user.firmId,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(serviceItems)
  } catch (error) {
    console.error('Get service items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
