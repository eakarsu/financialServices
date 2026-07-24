import { createHmac } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import prisma from '@/lib/prisma'

const demoUsers = [
  {
    id: 'user-001',
    email: 'admin@example.com',
    firstName: 'John',
    lastName: 'Smith',
    role: UserRole.ADMIN,
  },
  {
    id: 'user-002',
    email: 'staff@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.STAFF,
  },
  {
    id: 'user-003',
    email: 'sarah.wilson@example.com',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: UserRole.STAFF,
  },
]

export function resolveDemoPassword(): string {
  const configuredPassword =
    process.env.DEMO_PASSWORD ||
    process.env.SEED_DEMO_PASSWORD ||
    process.env.DEMO_SEED_PASSWORD ||
    ''

  if (configuredPassword) return configuredPassword

  const jwtSecret = process.env.JWT_SECRET || ''
  if (process.env.NODE_ENV === 'production' || jwtSecret.length < 32) return ''

  return createHmac('sha256', jwtSecret)
    .update('financial-services-local-demo-credentials')
    .digest('base64url')
}

export async function provisionDemoUsers(password: string): Promise<number> {
  if (password.length < 12 || password.length > 1024) {
    throw new Error('Demo password must contain 12-1024 characters')
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const firm = await prisma.firm.upsert({
    where: { id: 'firm-001' },
    update: {},
    create: {
      id: 'firm-001',
      name: 'Smith & Associates CPAs',
      email: 'info@smithcpas.com',
    },
  })

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword,
        firmId: firm.id,
        isActive: true,
        emailVerified: true,
      },
      create: {
        ...user,
        password: hashedPassword,
        firmId: firm.id,
        isActive: true,
        emailVerified: true,
      },
    })
  }

  return demoUsers.length
}
