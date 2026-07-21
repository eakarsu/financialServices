import type { User } from '@prisma/client'
import prisma from './prisma'
import { hasPermission, Permission } from './permissions'

export type RequiredDocumentAccess = 'VIEW' | 'EDIT' | 'MANAGE'

const accessRank: Record<RequiredDocumentAccess, number> = {
  VIEW: 1,
  EDIT: 2,
  MANAGE: 3,
}

const permissionForAccess: Record<RequiredDocumentAccess, Permission> = {
  VIEW: Permission.VIEW_DOCUMENTS,
  EDIT: Permission.EDIT_DOCUMENTS,
  MANAGE: Permission.SHARE_DOCUMENTS,
}

export class DocumentAccessError extends Error {
  constructor(public readonly status: 401 | 403 | 404, message: string) {
    super(message)
  }
}

export function accessLevelSatisfies(actual: string, required: RequiredDocumentAccess): boolean {
  return (accessRank[actual as RequiredDocumentAccess] || 0) >= accessRank[required]
}

export function activeGrant(
  grant: { accessLevel: string; expiresAt: Date | null; revokedAt: Date | null },
  required: RequiredDocumentAccess,
  now = new Date()
): boolean {
  return !grant.revokedAt && (!grant.expiresAt || grant.expiresAt > now) &&
    accessLevelSatisfies(grant.accessLevel, required)
}

export async function getDocumentForAccess(
  documentId: string,
  user: Pick<User, 'id' | 'firmId' | 'role' | 'isActive'>,
  required: RequiredDocumentAccess
) {
  if (!user.isActive || !user.firmId) throw new DocumentAccessError(401, 'Unauthorized')
  if (!hasPermission(user.role, permissionForAccess[required])) {
    throw new DocumentAccessError(403, 'Forbidden')
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, firmId: user.firmId },
    include: {
      client: {
        include: {
          assignments: { where: { userId: user.id }, select: { id: true } },
        },
      },
      accessGrants: { where: { userId: user.id } },
      legalHoldLinks: { include: { legalHold: true } },
    },
  })

  if (!document) throw new DocumentAccessError(404, 'Document not found')

  const elevated = user.role === 'ADMIN' || user.role === 'PARTNER'
  const granted = document.accessGrants.some((grant) => activeGrant(grant, required))
  const assigned = Boolean(document.client?.assignments.length)
  const ownsUpload = document.uploadedById === user.id

  // Privileged material always requires firm leadership or an explicit grant.
  if (document.isPrivileged && !elevated && !granted) {
    throw new DocumentAccessError(403, 'Privileged document access denied')
  }

  if (!elevated && !granted && !assigned && !ownsUpload) {
    throw new DocumentAccessError(403, 'Document is outside your assigned matter')
  }

  return document
}

export function requiresProfessionalReview(type: string): boolean {
  return type === 'CONTRACT' || type === 'ENGAGEMENT_LETTER'
}

export function validateReviewEvidence(input: {
  type: string
  jurisdiction?: string | null
  effectiveDate?: Date | null
}): void {
  if (!requiresProfessionalReview(input.type)) return
  if (!input.jurisdiction?.trim()) throw new Error('Jurisdiction is required for legal documents')
  if (!input.effectiveDate) throw new Error('Effective date is required for legal documents')
}
