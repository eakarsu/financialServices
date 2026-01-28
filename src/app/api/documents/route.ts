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
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {
      OR: [
        { client: { firmId: user.firmId } },
        { uploadedBy: { firmId: user.firmId } },
      ],
    }

    if (clientId) where.clientId = clientId
    if (type && type !== 'all') where.type = type
    if (status && status !== 'all') where.status = status
    if (search) {
      where.AND = {
        name: { contains: search, mode: 'insensitive' },
      }
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        uploadedBy: { select: { firstName: true, lastName: true } },
        folder: true,
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Get documents error:', error)
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

    const document = await prisma.document.create({
      data: {
        ...data,
        uploadedById: user.id,
      },
      include: {
        client: true,
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
