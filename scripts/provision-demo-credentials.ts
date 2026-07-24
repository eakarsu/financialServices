import prisma from '@/lib/prisma'
import { provisionDemoUsers, resolveDemoPassword } from '@/lib/demo-credentials'

async function main() {
  const provisionedCount = await provisionDemoUsers(resolveDemoPassword())
  console.log(`Provisioned ${provisionedCount} local demo users.`)
}

main()
  .catch((error) => {
    console.error('Unable to provision local demo users:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
