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
    const clientId = searchParams.get('client')
    const taxYear = searchParams.get('year')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {
      client: { firmId: user.firmId },
    }

    if (clientId) where.clientId = clientId
    if (taxYear) where.taxYear = parseInt(taxYear)
    if (status && status !== 'all') where.status = status

    const returns = await prisma.taxReturn.findMany({
      where,
      orderBy: [{ taxYear: 'desc' }, { createdAt: 'desc' }],
      include: {
        client: true,
        organizer: true,
        checklistItems: true,
        estimates: true,
      },
    })

    return NextResponse.json(returns)
  } catch (error) {
    console.error('Get tax returns error:', error)
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

    // Default due date based on return type
    let dueDate = new Date(data.taxYear + 1, 3, 15) // April 15
    if (data.type === 'BUSINESS_1120S' || data.type === 'BUSINESS_1065') {
      dueDate = new Date(data.taxYear + 1, 2, 15) // March 15
    }

    const taxReturn = await prisma.taxReturn.create({
      data: {
        ...data,
        dueDate,
        status: 'NOT_STARTED',
      },
      include: {
        client: true,
      },
    })

    // Fetch checklist templates from database
    const checklistTemplates = await prisma.taxChecklistTemplate.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { firmId: user.firmId },
              { firmId: null }, // System-wide templates
            ],
          },
          {
            OR: [
              { returnType: data.type },
              { returnType: null }, // Applies to all return types
            ],
          },
        ],
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })

    // Create checklist items from templates
    if (checklistTemplates.length > 0) {
      await prisma.taxChecklistItem.createMany({
        data: checklistTemplates.map(template => ({
          name: template.name,
          category: template.category,
          isRequired: template.isRequired,
          taxReturnId: taxReturn.id,
        })),
      })
    } else {
      // Fallback to default items if no templates exist
      const defaultItems = [
        { name: 'W-2 Forms', category: 'Income', isRequired: true },
        { name: '1099 Forms', category: 'Income', isRequired: true },
        { name: 'Prior Year Tax Return', category: 'Reference', isRequired: true },
        { name: 'Photo ID', category: 'Verification', isRequired: true },
      ]
      await prisma.taxChecklistItem.createMany({
        data: defaultItems.map(item => ({
          ...item,
          taxReturnId: taxReturn.id,
        })),
      })
    }

    // Create organizer
    await prisma.taxOrganizer.create({
      data: {
        taxReturnId: taxReturn.id,
        completedSections: [],
      },
    })

    return NextResponse.json(taxReturn)
  } catch (error) {
    console.error('Create tax return error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
