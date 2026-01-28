import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {
      isActive: true,
      OR: [
        { firmId: user.firmId },
        { isSystem: true },
      ],
    }

    if (category) {
      where.category = category
    }

    const templates = await prisma.documentRequestTemplate.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching document request templates:', error)
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

    // Get the max sort order
    const maxSort = await prisma.documentRequestTemplate.aggregate({
      where: { firmId: user.firmId },
      _max: { sortOrder: true },
    })

    const template = await prisma.documentRequestTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
        firmId: user.firmId,
        isSystem: false,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating document request template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
