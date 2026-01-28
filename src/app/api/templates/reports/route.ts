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

    const templates = await prisma.reportTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching report templates:', error)
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

    const template = await prisma.reportTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        config: data.config,
        firmId: user.firmId,
        isSystem: false,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating report template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
