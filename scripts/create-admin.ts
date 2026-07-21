import bcrypt from 'bcryptjs'
import prisma from '../src/lib/prisma'

async function main() {
  const email = String(process.env.ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase()
  const password = String(process.env.ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD || '')
  if (!email || !email.includes('@')) throw new Error('ADMIN_EMAIL must be a valid email address.')
  if (password.length < 12 || password.length > 72) throw new Error('ADMIN_PASSWORD must contain 12-72 characters.')
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    console.log(`Administrator ${email} already exists; no changes made.`)
    return
  }
  const firm = await prisma.firm.create({
    data: { name: String(process.env.BOOTSTRAP_TENANT_NAME || 'Runtime Acceptance Firm'), email },
  })
  await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 12),
      firstName: 'Runtime',
      lastName: 'Administrator',
      role: 'ADMIN',
      firmId: firm.id,
      isActive: true,
      emailVerified: true,
    },
  })
  console.log(`Created administrator ${email}.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
