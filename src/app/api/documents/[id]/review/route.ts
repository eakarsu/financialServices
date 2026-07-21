import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { DocumentAccessError, getDocumentForAccess } from '@/lib/document-governance'
import { reviewDocumentVersion } from '@/lib/documents'
import { requestContext } from '@/lib/request-context'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const document = await getDocumentForAccess(id, user, 'EDIT')
    const input = await request.json()
    if (input.decision !== 'APPROVED' && input.decision !== 'REJECTED') {
      return NextResponse.json({ error: 'Decision must be APPROVED or REJECTED' }, { status: 400 })
    }
    const reviewed = await reviewDocumentVersion(document, user, input.decision, {
      note: typeof input.note === 'string' ? input.note : '',
      jurisdiction: typeof input.jurisdiction === 'string' ? input.jurisdiction : document.jurisdiction,
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : document.effectiveDate,
    }, requestContext(request))
    return NextResponse.json(reviewed)
  } catch (error) {
    if (error instanceof DocumentAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Review failed' }, { status: 400 })
  }
}
