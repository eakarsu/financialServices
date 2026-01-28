import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleEmployees = [
  { firstName: 'Michael', lastName: 'Johnson', email: 'mjohnson@example.com', payType: 'HOURLY', payRate: 25.50 },
  { firstName: 'Sarah', lastName: 'Williams', email: 'swilliams@example.com', payType: 'SALARY', payRate: 65000 },
  { firstName: 'David', lastName: 'Brown', email: 'dbrown@example.com', payType: 'HOURLY', payRate: 22.00 },
  { firstName: 'Jennifer', lastName: 'Davis', email: 'jdavis@example.com', payType: 'SALARY', payRate: 55000 },
  { firstName: 'Robert', lastName: 'Miller', email: 'rmiller@example.com', payType: 'HOURLY', payRate: 28.75 },
  { firstName: 'Lisa', lastName: 'Wilson', email: 'lwilson@example.com', payType: 'HOURLY', payRate: 24.00 },
  { firstName: 'James', lastName: 'Moore', email: 'jmoore@example.com', payType: 'SALARY', payRate: 72000 },
  { firstName: 'Patricia', lastName: 'Taylor', email: 'ptaylor@example.com', payType: 'HOURLY', payRate: 26.50 },
  { firstName: 'Christopher', lastName: 'Anderson', email: 'canderson@example.com', payType: 'SALARY', payRate: 68000 },
  { firstName: 'Linda', lastName: 'Thomas', email: 'lthomas@example.com', payType: 'HOURLY', payRate: 23.50 },
  { firstName: 'Matthew', lastName: 'Jackson', email: 'mjackson@example.com', payType: 'HOURLY', payRate: 27.00 },
  { firstName: 'Barbara', lastName: 'White', email: 'bwhite@example.com', payType: 'SALARY', payRate: 60000 },
  { firstName: 'Daniel', lastName: 'Harris', email: 'dharris@example.com', payType: 'HOURLY', payRate: 29.00 },
  { firstName: 'Nancy', lastName: 'Martin', email: 'nmartin@example.com', payType: 'SALARY', payRate: 58000 },
  { firstName: 'Anthony', lastName: 'Thompson', email: 'athompson@example.com', payType: 'HOURLY', payRate: 25.00 },
]

const payFrequencies = ['WEEKLY', 'BI_WEEKLY', 'SEMI_MONTHLY', 'MONTHLY']
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego']
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA']

async function main() {
  console.log('Seeding employee data...')

  // Get all clients
  const clients = await prisma.client.findMany({
    select: { id: true, businessName: true, firstName: true, lastName: true },
  })

  console.log(`Found ${clients.length} clients`)

  if (clients.length === 0) {
    console.log('No clients found. Please create clients first.')
    return
  }

  let totalEmployees = 0
  let employeeNumber = 1000

  for (const client of clients) {
    const clientName = client.businessName || `${client.firstName} ${client.lastName}`
    console.log(`\nAdding employees for client: ${clientName}`)

    // Add 3-5 employees per client
    const numEmployees = Math.floor(Math.random() * 3) + 3

    for (let i = 0; i < numEmployees; i++) {
      const employee = sampleEmployees[totalEmployees % sampleEmployees.length]
      const payFrequency = payFrequencies[Math.floor(Math.random() * payFrequencies.length)]
      const city = cities[Math.floor(Math.random() * cities.length)]
      const state = states[Math.floor(Math.random() * states.length)]

      // Random hire date within last 2 years
      const hireDate = new Date()
      hireDate.setDate(hireDate.getDate() - Math.floor(Math.random() * 730))

      // Random date of birth (25-55 years old)
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - (25 + Math.floor(Math.random() * 30)))

      // 90% active, 10% inactive
      const status = Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE'

      try {
        await prisma.employee.create({
          data: {
            employeeNumber: `EMP-${employeeNumber}`,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email.replace('@example.com', `+${employeeNumber}@example.com`),
            phone: `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            hireDate,
            dateOfBirth,
            status: status as any,
            payType: employee.payType as any,
            payRate: employee.payRate,
            payFrequency: payFrequency as any,
            address: `${Math.floor(Math.random() * 9999) + 1} Main St`,
            city,
            state,
            zipCode: String(Math.floor(Math.random() * 90000) + 10000),
            federalFilingStatus: 'SINGLE',
            federalAllowances: Math.floor(Math.random() * 3),
            stateFilingStatus: 'SINGLE',
            stateAllowances: Math.floor(Math.random() * 3),
            additionalWithholding: 0,
            directDepositEnabled: Math.random() > 0.3,
            clientId: client.id,
          },
        })

        console.log(`  ✓ Created employee: ${employee.firstName} ${employee.lastName} (EMP-${employeeNumber})`)
        employeeNumber++
        totalEmployees++
      } catch (error) {
        console.error(`  ✗ Error creating employee:`, error)
      }
    }
  }

  console.log(`\n✅ Successfully created ${totalEmployees} employees across ${clients.length} clients`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
