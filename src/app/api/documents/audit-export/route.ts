import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { verifyAuditChain } from '@/lib/audit'
import { buildDocumentAuditCsv } from '@/lib/document-audit-export'

export async function GET() {
  const user = await getCurrentUser()
  if (!user?.firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'PARTNER'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const [documents, events, chainValid] = await Promise.all([
    prisma.document.findMany({
      where: { firmId: user.firmId },
      include: { versions: { orderBy: { version: 'asc' } }, legalHoldLinks: { include: { legalHold: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.auditLog.findMany({ where: { firmId: user.firmId }, orderBy: { sequence: 'asc' } }),
    verifyAuditChain(user.firmId),
  ])
  const csv = buildDocumentAuditCsv({ documents, events, chainValid })
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="document-audit-export.csv"',
      'Cache-Control': 'private, no-store',
    },
  })
}
