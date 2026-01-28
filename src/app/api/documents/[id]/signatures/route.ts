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
    const { signerName, signerEmail } = await request.json()

    const signature = await prisma.documentSignature.create({
      data: {
        documentId: id,
        signerName,
        signerEmail,
        status: 'PENDING',
      },
    })

    // In production, you would send an email to the signer here

    return NextResponse.json(signature)
  } catch (error) {
    console.error('Create signature error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { signatureId, status, signatureData } = await request.json()

    const signature = await prisma.documentSignature.update({
      where: { id: signatureId },
      data: {
        status,
        signatureData,
        signedAt: status === 'SIGNED' ? new Date() : null,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    })

    // Update document status if all signatures are complete
    const allSignatures = await prisma.documentSignature.findMany({
      where: { documentId: id },
    })

    const allSigned = allSignatures.every(s => s.status === 'SIGNED')
    if (allSigned) {
      await prisma.document.update({
        where: { id },
        data: { status: 'SIGNED' },
      })
    }

    return NextResponse.json(signature)
  } catch (error) {
    console.error('Update signature error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
