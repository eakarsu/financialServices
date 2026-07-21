import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { Permission, hasPermission } from '@/lib/permissions'
import { requireSecret } from '@/lib/secrets'

export interface AuthUser {
  id: string
  email: string
  role: string
  firmId: string
}

export function requireAuth(handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const token = req.cookies.get('auth-token')?.value

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const decoded = verify(token, requireSecret('JWT_SECRET')) as AuthUser
      return handler(req, decoded)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }
}

export function requirePermission(permission: Permission) {
  return (handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) => {
    return requireAuth(async (req: NextRequest, user: AuthUser) => {
      if (!hasPermission(user.role, permission)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have permission to perform this action' },
          { status: 403 }
        )
      }

      return handler(req, user)
    })
  }
}

export function requireAnyPermission(permissions: Permission[]) {
  return (handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) => {
    return requireAuth(async (req: NextRequest, user: AuthUser) => {
      const hasAnyPerm = permissions.some(perm => hasPermission(user.role, perm))

      if (!hasAnyPerm) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have permission to perform this action' },
          { status: 403 }
        )
      }

      return handler(req, user)
    })
  }
}

export function requireRole(allowedRoles: string[]) {
  return (handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) => {
    return requireAuth(async (req: NextRequest, user: AuthUser) => {
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient privileges' },
          { status: 403 }
        )
      }

      return handler(req, user)
    })
  }
}
