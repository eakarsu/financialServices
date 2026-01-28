import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail, sendInvoiceEmail, sendDocumentRequest } from '@/lib/email'
import { Permission, hasPermission } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, Permission.SEND_INVOICES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { type, data } = await request.json()

    switch (type) {
      case 'invoice':
        await sendInvoiceEmail(
          data.clientEmail,
          data.clientName,
          data.invoiceNumber,
          data.amount,
          data.dueDate,
          data.paymentUrl
        )
        break

      case 'document_request':
        await sendDocumentRequest(
          data.clientEmail,
          data.clientName,
          data.documents,
          data.dueDate
        )
        break

      case 'custom':
        await sendEmail({
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        })
        break

      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
