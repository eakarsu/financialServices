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
    const returnType = searchParams.get('returnType')

    const where: Record<string, unknown> = {
      isActive: true,
      OR: [
        { firmId: user.firmId },
        { firmId: null }, // System-wide templates
      ],
    }

    if (category) {
      where.category = category
    }

    if (returnType) {
      where.returnType = returnType
    }

    const templates = await prisma.taxChecklistTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching tax checklist templates:', error)
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

    // Get the max sort order for this category
    const maxSort = await prisma.taxChecklistTemplate.aggregate({
      where: {
        firmId: user.firmId,
        category: data.category,
      },
      _max: { sortOrder: true },
    })

    const template = await prisma.taxChecklistTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        returnType: data.returnType || null,
        isRequired: data.isRequired ?? false,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
        firmId: user.firmId,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating tax checklist template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
