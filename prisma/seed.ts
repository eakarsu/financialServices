import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with comprehensive sample data...')

  const hashedPassword = await bcrypt.hash('password123', 12)
  const currentYear = new Date().getFullYear()

  // Create firm
  const firm = await prisma.firm.upsert({
    where: { id: 'firm-001' },
    update: {},
    create: {
      id: 'firm-001',
      name: 'Smith & Associates CPAs',
      email: 'info@smithcpas.com',
      phone: '(555) 123-4567',
      address: '123 Main Street, Suite 100',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      website: 'https://smithcpas.com',
    },
  })

  // Create firm settings
  await prisma.firmSettings.upsert({
    where: { firmId: firm.id },
    update: {},
    create: {
      firmId: firm.id,
      fiscalYearStart: 1,
      defaultHourlyRate: 175.00,
      invoicePrefix: 'INV',
      invoiceNextNumber: 1001,
      defaultPaymentTerms: 30,
    },
  })

  // Create 15+ users
  const users = [
    { id: 'user-001', email: 'admin@example.com', firstName: 'John', lastName: 'Smith', role: 'ADMIN', phone: '(555) 123-4567' },
    { id: 'user-002', email: 'staff@example.com', firstName: 'Jane', lastName: 'Doe', role: 'STAFF', phone: '(555) 234-5678' },
    { id: 'user-003', email: 'sarah.wilson@example.com', firstName: 'Sarah', lastName: 'Wilson', role: 'STAFF', phone: '(555) 345-6789' },
    { id: 'user-004', email: 'mike.johnson@example.com', firstName: 'Mike', lastName: 'Johnson', role: 'STAFF', phone: '(555) 456-7890' },
    { id: 'user-005', email: 'emily.brown@example.com', firstName: 'Emily', lastName: 'Brown', role: 'STAFF', phone: '(555) 567-8901' },
    { id: 'user-006', email: 'david.lee@example.com', firstName: 'David', lastName: 'Lee', role: 'ADMIN', phone: '(555) 678-9012' },
    { id: 'user-007', email: 'lisa.garcia@example.com', firstName: 'Lisa', lastName: 'Garcia', role: 'STAFF', phone: '(555) 789-0123' },
    { id: 'user-008', email: 'robert.martinez@example.com', firstName: 'Robert', lastName: 'Martinez', role: 'STAFF', phone: '(555) 890-1234' },
    { id: 'user-009', email: 'jennifer.taylor@example.com', firstName: 'Jennifer', lastName: 'Taylor', role: 'STAFF', phone: '(555) 901-2345' },
    { id: 'user-010', email: 'william.anderson@example.com', firstName: 'William', lastName: 'Anderson', role: 'STAFF', phone: '(555) 012-3456' },
    { id: 'user-011', email: 'amanda.thomas@example.com', firstName: 'Amanda', lastName: 'Thomas', role: 'STAFF', phone: '(555) 111-2222' },
    { id: 'user-012', email: 'chris.jackson@example.com', firstName: 'Chris', lastName: 'Jackson', role: 'STAFF', phone: '(555) 222-3333' },
    { id: 'user-013', email: 'michelle.white@example.com', firstName: 'Michelle', lastName: 'White', role: 'STAFF', phone: '(555) 333-4444' },
    { id: 'user-014', email: 'daniel.harris@example.com', firstName: 'Daniel', lastName: 'Harris', role: 'STAFF', phone: '(555) 444-5555' },
    { id: 'user-015', email: 'jessica.clark@example.com', firstName: 'Jessica', lastName: 'Clark', role: 'STAFF', phone: '(555) 555-6666' },
    { id: 'user-016', email: 'kevin.lewis@example.com', firstName: 'Kevin', lastName: 'Lewis', role: 'STAFF', phone: '(555) 666-7777' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password: hashedPassword,
        role: user.role as 'ADMIN' | 'STAFF' | 'CLIENT',
        firmId: firm.id,
        emailVerified: true,
      },
    })
  }

  // Create 25+ chart of accounts
  const accounts = [
    { accountNumber: '1000', name: 'Cash', type: 'ASSET', subType: 'Current Asset' },
    { accountNumber: '1010', name: 'Petty Cash', type: 'ASSET', subType: 'Current Asset' },
    { accountNumber: '1100', name: 'Accounts Receivable', type: 'ASSET', subType: 'Current Asset' },
    { accountNumber: '1150', name: 'Allowance for Doubtful Accounts', type: 'ASSET', subType: 'Current Asset' },
    { accountNumber: '1200', name: 'Inventory', type: 'ASSET', subType: 'Current Asset' },
    { accountNumber: '1300', name: 'Prepaid Expenses', type: 'ASSET', subType: 'Current Asset' },
    { accountNumber: '1500', name: 'Fixed Assets - Equipment', type: 'ASSET', subType: 'Fixed Asset' },
    { accountNumber: '1510', name: 'Fixed Assets - Furniture', type: 'ASSET', subType: 'Fixed Asset' },
    { accountNumber: '1520', name: 'Fixed Assets - Vehicles', type: 'ASSET', subType: 'Fixed Asset' },
    { accountNumber: '1550', name: 'Accumulated Depreciation', type: 'ASSET', subType: 'Fixed Asset' },
    { accountNumber: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'Current Liability' },
    { accountNumber: '2100', name: 'Credit Cards Payable', type: 'LIABILITY', subType: 'Current Liability' },
    { accountNumber: '2200', name: 'Accrued Expenses', type: 'LIABILITY', subType: 'Current Liability' },
    { accountNumber: '2300', name: 'Payroll Liabilities', type: 'LIABILITY', subType: 'Current Liability' },
    { accountNumber: '2400', name: 'Sales Tax Payable', type: 'LIABILITY', subType: 'Current Liability' },
    { accountNumber: '2500', name: 'Long-term Loan', type: 'LIABILITY', subType: 'Long-term Liability' },
    { accountNumber: '2600', name: 'Mortgage Payable', type: 'LIABILITY', subType: 'Long-term Liability' },
    { accountNumber: '3000', name: "Owner's Equity", type: 'EQUITY', subType: "Owner's Equity" },
    { accountNumber: '3100', name: 'Retained Earnings', type: 'EQUITY', subType: 'Retained Earnings' },
    { accountNumber: '3200', name: "Owner's Draw", type: 'EQUITY', subType: "Owner's Equity" },
    { accountNumber: '4000', name: 'Sales Revenue', type: 'REVENUE', subType: 'Operating Revenue' },
    { accountNumber: '4100', name: 'Service Revenue', type: 'REVENUE', subType: 'Operating Revenue' },
    { accountNumber: '4200', name: 'Consulting Revenue', type: 'REVENUE', subType: 'Operating Revenue' },
    { accountNumber: '4300', name: 'Interest Income', type: 'REVENUE', subType: 'Other Income' },
    { accountNumber: '4400', name: 'Other Income', type: 'REVENUE', subType: 'Other Income' },
    { accountNumber: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'Cost of Sales' },
    { accountNumber: '5100', name: 'Direct Labor', type: 'EXPENSE', subType: 'Cost of Sales' },
    { accountNumber: '6000', name: 'Payroll Expense', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6050', name: 'Payroll Taxes', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6100', name: 'Rent Expense', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6200', name: 'Utilities Expense', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6300', name: 'Office Supplies', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6400', name: 'Insurance Expense', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6500', name: 'Professional Fees', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6600', name: 'Travel Expense', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6700', name: 'Marketing Expense', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6800', name: 'Depreciation Expense', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '6900', name: 'Repairs & Maintenance', type: 'EXPENSE', subType: 'Operating Expense' },
    { accountNumber: '7000', name: 'Interest Expense', type: 'EXPENSE', subType: 'Other Expense' },
    { accountNumber: '7100', name: 'Bank Fees', type: 'EXPENSE', subType: 'Other Expense' },
  ]

  for (const account of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { firmId_accountNumber: { firmId: firm.id, accountNumber: account.accountNumber } },
      update: {},
      create: { ...account, type: account.type as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE', firmId: firm.id },
    })
  }

  // Create 20+ clients
  const clients = [
    { id: 'client-001', clientNumber: 'C-001', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Acme Corporation', entityType: 'S_CORP', ein: '12-3456789', email: 'contact@acmecorp.com', phone: '(555) 111-2222', address: '456 Business Ave', city: 'Los Angeles', state: 'CA', zipCode: '90001' },
    { id: 'client-002', clientNumber: 'C-002', type: 'INDIVIDUAL', status: 'ACTIVE', firstName: 'Robert', lastName: 'Johnson', email: 'robert.johnson@email.com', phone: '(555) 333-4444', address: '789 Oak Street', city: 'Chicago', state: 'IL', zipCode: '60601' },
    { id: 'client-003', clientNumber: 'C-003', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Tech Startup Inc', entityType: 'C_CORP', email: 'cfo@techstartup.io', phone: '(555) 555-6666', address: '100 Innovation Way', city: 'San Francisco', state: 'CA', zipCode: '94102' },
    { id: 'client-004', clientNumber: 'C-004', type: 'INDIVIDUAL', status: 'PROSPECT', firstName: 'Sarah', lastName: 'Williams', email: 'sarah.w@email.com', phone: '(555) 777-8888', address: '222 Elm Street', city: 'Miami', state: 'FL', zipCode: '33101' },
    { id: 'client-005', clientNumber: 'C-005', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Green Gardens LLC', entityType: 'LLC', ein: '23-4567890', email: 'info@greengardens.com', phone: '(555) 123-9876', address: '500 Garden Blvd', city: 'Portland', state: 'OR', zipCode: '97201' },
    { id: 'client-006', clientNumber: 'C-006', type: 'INDIVIDUAL', status: 'ACTIVE', firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@email.com', phone: '(555) 234-8765', address: '333 Pine Ave', city: 'Seattle', state: 'WA', zipCode: '98101' },
    { id: 'client-007', clientNumber: 'C-007', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Downtown Deli', entityType: 'SOLE_PROPRIETOR', email: 'owner@downtowndeli.com', phone: '(555) 345-7654', address: '42 Main St', city: 'Boston', state: 'MA', zipCode: '02101' },
    { id: 'client-008', clientNumber: 'C-008', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Pacific Imports', entityType: 'S_CORP', ein: '34-5678901', email: 'accounting@pacificimports.com', phone: '(555) 456-6543', address: '888 Harbor Dr', city: 'Long Beach', state: 'CA', zipCode: '90802' },
    { id: 'client-009', clientNumber: 'C-009', type: 'INDIVIDUAL', status: 'ACTIVE', firstName: 'Jennifer', lastName: 'Martinez', email: 'jen.martinez@email.com', phone: '(555) 567-5432', address: '1234 Sunset Blvd', city: 'Austin', state: 'TX', zipCode: '78701' },
    { id: 'client-010', clientNumber: 'C-010', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Mountain View Properties', entityType: 'LLC', ein: '45-6789012', email: 'info@mvproperties.com', phone: '(555) 678-4321', address: '999 Summit Rd', city: 'Denver', state: 'CO', zipCode: '80201' },
    { id: 'client-011', clientNumber: 'C-011', type: 'INDIVIDUAL', status: 'INACTIVE', firstName: 'David', lastName: 'Kim', email: 'david.kim@email.com', phone: '(555) 789-3210', address: '567 Valley Way', city: 'Phoenix', state: 'AZ', zipCode: '85001' },
    { id: 'client-012', clientNumber: 'C-012', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Creative Design Studio', entityType: 'LLC', email: 'hello@creativedesign.co', phone: '(555) 890-2109', address: '200 Art District', city: 'Nashville', state: 'TN', zipCode: '37201' },
    { id: 'client-013', clientNumber: 'C-013', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Riverside Medical Group', entityType: 'PARTNERSHIP', ein: '56-7890123', email: 'billing@riversidemedical.com', phone: '(555) 901-1098', address: '1500 Health Way', city: 'Atlanta', state: 'GA', zipCode: '30301' },
    { id: 'client-014', clientNumber: 'C-014', type: 'INDIVIDUAL', status: 'ACTIVE', firstName: 'Amanda', lastName: 'Thompson', email: 'amanda.t@email.com', phone: '(555) 012-0987', address: '789 Lake Shore', city: 'Minneapolis', state: 'MN', zipCode: '55401' },
    { id: 'client-015', clientNumber: 'C-015', type: 'BUSINESS', status: 'PROSPECT', businessName: 'Future Robotics Corp', entityType: 'C_CORP', email: 'investors@futurerobotics.io', phone: '(555) 234-9876', address: '2000 Tech Park', city: 'San Jose', state: 'CA', zipCode: '95101' },
    { id: 'client-016', clientNumber: 'C-016', type: 'INDIVIDUAL', status: 'ACTIVE', firstName: 'Christopher', lastName: 'Davis', email: 'chris.davis@email.com', phone: '(555) 345-8765', address: '456 Maple Ave', city: 'Philadelphia', state: 'PA', zipCode: '19101' },
    { id: 'client-017', clientNumber: 'C-017', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Sunshine Bakery', entityType: 'SOLE_PROPRIETOR', email: 'orders@sunshinebakery.com', phone: '(555) 456-7654', address: '123 Sweet St', city: 'San Diego', state: 'CA', zipCode: '92101' },
    { id: 'client-018', clientNumber: 'C-018', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Elite Consulting Group', entityType: 'LLC', ein: '67-8901234', email: 'partners@eliteconsulting.com', phone: '(555) 567-6543', address: '750 Executive Dr', city: 'Dallas', state: 'TX', zipCode: '75201' },
    { id: 'client-019', clientNumber: 'C-019', type: 'INDIVIDUAL', status: 'ACTIVE', firstName: 'Elizabeth', lastName: 'Wilson', email: 'liz.wilson@email.com', phone: '(555) 678-5432', address: '321 Rose Lane', city: 'Charlotte', state: 'NC', zipCode: '28201' },
    { id: 'client-020', clientNumber: 'C-020', type: 'BUSINESS', status: 'ACTIVE', businessName: 'Northern Logistics Inc', entityType: 'S_CORP', ein: '78-9012345', email: 'dispatch@northernlogistics.com', phone: '(555) 789-4321', address: '4500 Freight Blvd', city: 'Detroit', state: 'MI', zipCode: '48201' },
  ]

  for (const client of clients) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: {},
      create: {
        ...client,
        type: client.type as 'INDIVIDUAL' | 'BUSINESS',
        status: client.status as 'ACTIVE' | 'INACTIVE' | 'PROSPECT',
        entityType: client.entityType as 'SOLE_PROPRIETOR' | 'PARTNERSHIP' | 'LLC' | 'S_CORP' | 'C_CORP' | 'NON_PROFIT' | 'TRUST' | 'ESTATE' | undefined,
        firmId: firm.id,
      },
    })
  }

  // Create 20+ bank accounts
  const bankAccounts: Array<{ id: string; name: string; accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'OTHER'; institution: string; balance: number; clientId: string }> = [
    { id: 'bank-001', name: 'Acme Business Checking', accountType: 'CHECKING', institution: 'Chase Bank', balance: 45678.90, clientId: 'client-001' },
    { id: 'bank-002', name: 'Acme Business Savings', accountType: 'SAVINGS', institution: 'Chase Bank', balance: 125000.00, clientId: 'client-001' },
    { id: 'bank-003', name: 'Acme Credit Card', accountType: 'CREDIT_CARD', institution: 'American Express', balance: -5432.10, clientId: 'client-001' },
    { id: 'bank-004', name: 'Personal Checking', accountType: 'CHECKING', institution: 'Bank of America', balance: 12345.67, clientId: 'client-002' },
    { id: 'bank-005', name: 'Tech Startup Operating', accountType: 'CHECKING', institution: 'Silicon Valley Bank', balance: 234567.89, clientId: 'client-003' },
    { id: 'bank-006', name: 'Tech Startup Payroll', accountType: 'CHECKING', institution: 'Silicon Valley Bank', balance: 89000.00, clientId: 'client-003' },
    { id: 'bank-007', name: 'Green Gardens Checking', accountType: 'CHECKING', institution: 'Wells Fargo', balance: 34567.89, clientId: 'client-005' },
    { id: 'bank-008', name: 'Michael Chen Savings', accountType: 'SAVINGS', institution: 'Chase Bank', balance: 56789.01, clientId: 'client-006' },
    { id: 'bank-009', name: 'Downtown Deli Checking', accountType: 'CHECKING', institution: 'TD Bank', balance: 23456.78, clientId: 'client-007' },
    { id: 'bank-010', name: 'Pacific Imports Operating', accountType: 'CHECKING', institution: 'US Bank', balance: 156789.01, clientId: 'client-008' },
    { id: 'bank-011', name: 'Pacific Imports Credit Line', accountType: 'CREDIT_CARD', institution: 'Capital One', balance: -12345.67, clientId: 'client-008' },
    { id: 'bank-012', name: 'Jennifer Martinez Checking', accountType: 'CHECKING', institution: 'USAA', balance: 8765.43, clientId: 'client-009' },
    { id: 'bank-013', name: 'Mountain View Properties', accountType: 'CHECKING', institution: 'First Republic', balance: 445678.90, clientId: 'client-010' },
    { id: 'bank-014', name: 'Creative Design Checking', accountType: 'CHECKING', institution: 'PNC Bank', balance: 67890.12, clientId: 'client-012' },
    { id: 'bank-015', name: 'Riverside Medical Operating', accountType: 'CHECKING', institution: 'Regions Bank', balance: 234567.89, clientId: 'client-013' },
    { id: 'bank-016', name: 'Amanda Thompson Checking', accountType: 'CHECKING', institution: 'TCF Bank', balance: 15678.90, clientId: 'client-014' },
    { id: 'bank-017', name: 'Sunshine Bakery Checking', accountType: 'CHECKING', institution: 'Union Bank', balance: 28901.23, clientId: 'client-017' },
    { id: 'bank-018', name: 'Elite Consulting Operating', accountType: 'CHECKING', institution: 'Comerica', balance: 189012.34, clientId: 'client-018' },
    { id: 'bank-019', name: 'Elizabeth Wilson Savings', accountType: 'SAVINGS', institution: 'Ally Bank', balance: 45678.90, clientId: 'client-019' },
    { id: 'bank-020', name: 'Northern Logistics Checking', accountType: 'CHECKING', institution: 'Fifth Third', balance: 567890.12, clientId: 'client-020' },
  ]

  for (const account of bankAccounts) {
    await prisma.bankAccount.upsert({
      where: { id: account.id },
      update: {},
      create: account,
    })
  }

  // Get expense account for transactions
  const expenseAccount = await prisma.chartOfAccount.findFirst({
    where: { firmId: firm.id, accountNumber: '6300' },
  })

  // Create 30+ transactions
  const transactions = [
    { id: 'tx-001', description: 'Office Depot - Supplies', amount: 245.67, type: 'DEBIT', date: new Date('2024-11-15'), status: 'CATEGORIZED', clientId: 'client-001', bankAccountId: 'bank-001' },
    { id: 'tx-002', description: 'Amazon - Office Equipment', amount: 899.99, type: 'DEBIT', date: new Date('2024-11-12'), status: 'CATEGORIZED', clientId: 'client-001', bankAccountId: 'bank-001' },
    { id: 'tx-003', description: 'Client Payment - Invoice 1001', amount: 5000.00, type: 'CREDIT', date: new Date('2024-11-10'), status: 'REVIEWED', clientId: 'client-001', bankAccountId: 'bank-001' },
    { id: 'tx-004', description: 'AT&T - Phone Bill', amount: 189.00, type: 'DEBIT', date: new Date('2024-11-08'), status: 'CATEGORIZED', clientId: 'client-001', bankAccountId: 'bank-001' },
    { id: 'tx-005', description: 'Electric Company - Utilities', amount: 456.78, type: 'DEBIT', date: new Date('2024-11-05'), status: 'CATEGORIZED', clientId: 'client-001', bankAccountId: 'bank-001' },
    { id: 'tx-006', description: 'Software Subscription - Adobe', amount: 54.99, type: 'DEBIT', date: new Date('2024-11-01'), status: 'CATEGORIZED', clientId: 'client-003', bankAccountId: 'bank-005' },
    { id: 'tx-007', description: 'Client Retainer Fee', amount: 15000.00, type: 'CREDIT', date: new Date('2024-11-02'), status: 'REVIEWED', clientId: 'client-003', bankAccountId: 'bank-005' },
    { id: 'tx-008', description: 'Google Cloud Services', amount: 1234.56, type: 'DEBIT', date: new Date('2024-11-03'), status: 'PENDING', clientId: 'client-003', bankAccountId: 'bank-005' },
    { id: 'tx-009', description: 'WeWork - Office Space', amount: 2500.00, type: 'DEBIT', date: new Date('2024-11-01'), status: 'CATEGORIZED', clientId: 'client-003', bankAccountId: 'bank-005' },
    { id: 'tx-010', description: 'Supplier Payment - Garden Supplies', amount: 3456.78, type: 'DEBIT', date: new Date('2024-11-04'), status: 'PENDING', clientId: 'client-005', bankAccountId: 'bank-007' },
    { id: 'tx-011', description: 'Customer Payment - Landscaping', amount: 7500.00, type: 'CREDIT', date: new Date('2024-11-06'), status: 'REVIEWED', clientId: 'client-005', bankAccountId: 'bank-007' },
    { id: 'tx-012', description: 'Truck Maintenance', amount: 567.89, type: 'DEBIT', date: new Date('2024-11-07'), status: 'CATEGORIZED', clientId: 'client-005', bankAccountId: 'bank-007' },
    { id: 'tx-013', description: 'Food Supplies - Sysco', amount: 2345.67, type: 'DEBIT', date: new Date('2024-11-08'), status: 'CATEGORIZED', clientId: 'client-007', bankAccountId: 'bank-009' },
    { id: 'tx-014', description: 'Daily Sales Deposit', amount: 1890.45, type: 'CREDIT', date: new Date('2024-11-09'), status: 'REVIEWED', clientId: 'client-007', bankAccountId: 'bank-009' },
    { id: 'tx-015', description: 'Equipment Repair', amount: 450.00, type: 'DEBIT', date: new Date('2024-11-10'), status: 'PENDING', clientId: 'client-007', bankAccountId: 'bank-009' },
    { id: 'tx-016', description: 'Shipping Container - Import', amount: 12345.67, type: 'DEBIT', date: new Date('2024-11-11'), status: 'CATEGORIZED', clientId: 'client-008', bankAccountId: 'bank-010' },
    { id: 'tx-017', description: 'Customer Order Payment', amount: 45678.90, type: 'CREDIT', date: new Date('2024-11-12'), status: 'REVIEWED', clientId: 'client-008', bankAccountId: 'bank-010' },
    { id: 'tx-018', description: 'Customs Duties', amount: 3456.78, type: 'DEBIT', date: new Date('2024-11-13'), status: 'CATEGORIZED', clientId: 'client-008', bankAccountId: 'bank-010' },
    { id: 'tx-019', description: 'Medical Supplies - McKesson', amount: 8901.23, type: 'DEBIT', date: new Date('2024-11-14'), status: 'PENDING', clientId: 'client-013', bankAccountId: 'bank-015' },
    { id: 'tx-020', description: 'Insurance Reimbursement', amount: 15678.90, type: 'CREDIT', date: new Date('2024-11-15'), status: 'REVIEWED', clientId: 'client-013', bankAccountId: 'bank-015' },
    { id: 'tx-021', description: 'Lab Equipment', amount: 5678.90, type: 'DEBIT', date: new Date('2024-11-16'), status: 'CATEGORIZED', clientId: 'client-013', bankAccountId: 'bank-015' },
    { id: 'tx-022', description: 'Property Tax Payment', amount: 8765.43, type: 'DEBIT', date: new Date('2024-11-17'), status: 'CATEGORIZED', clientId: 'client-010', bankAccountId: 'bank-013' },
    { id: 'tx-023', description: 'Rent Collection - Unit A', amount: 3500.00, type: 'CREDIT', date: new Date('2024-11-18'), status: 'REVIEWED', clientId: 'client-010', bankAccountId: 'bank-013' },
    { id: 'tx-024', description: 'Rent Collection - Unit B', amount: 4200.00, type: 'CREDIT', date: new Date('2024-11-18'), status: 'REVIEWED', clientId: 'client-010', bankAccountId: 'bank-013' },
    { id: 'tx-025', description: 'Design Software - Figma', amount: 45.00, type: 'DEBIT', date: new Date('2024-11-19'), status: 'CATEGORIZED', clientId: 'client-012', bankAccountId: 'bank-014' },
    { id: 'tx-026', description: 'Client Project Payment', amount: 12500.00, type: 'CREDIT', date: new Date('2024-11-20'), status: 'REVIEWED', clientId: 'client-012', bankAccountId: 'bank-014' },
    { id: 'tx-027', description: 'Fuel - Fleet Cards', amount: 4567.89, type: 'DEBIT', date: new Date('2024-11-21'), status: 'PENDING', clientId: 'client-020', bankAccountId: 'bank-020' },
    { id: 'tx-028', description: 'Freight Revenue', amount: 67890.12, type: 'CREDIT', date: new Date('2024-11-22'), status: 'REVIEWED', clientId: 'client-020', bankAccountId: 'bank-020' },
    { id: 'tx-029', description: 'Truck Insurance Premium', amount: 2345.67, type: 'DEBIT', date: new Date('2024-11-23'), status: 'CATEGORIZED', clientId: 'client-020', bankAccountId: 'bank-020' },
    { id: 'tx-030', description: 'Baking Supplies - US Foods', amount: 1234.56, type: 'DEBIT', date: new Date('2024-11-24'), status: 'PENDING', clientId: 'client-017', bankAccountId: 'bank-017' },
  ]

  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: {},
      create: {
        ...tx,
        type: tx.type as 'DEBIT' | 'CREDIT',
        status: tx.status as 'PENDING' | 'CATEGORIZED' | 'REVIEWED',
        categoryId: expenseAccount?.id,
      },
    })
  }

  // Create 20+ tax returns
  const taxReturns = [
    { clientId: 'client-001', taxYear: currentYear, type: 'BUSINESS_1120S', status: 'IN_PROGRESS', dueDate: new Date(currentYear + 1, 2, 15) },
    { clientId: 'client-001', taxYear: currentYear - 1, type: 'BUSINESS_1120S', status: 'FILED', dueDate: new Date(currentYear, 2, 15) },
    { clientId: 'client-002', taxYear: currentYear, type: 'INDIVIDUAL_1040', status: 'GATHERING_INFO', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-002', taxYear: currentYear - 1, type: 'INDIVIDUAL_1040', status: 'FILED', dueDate: new Date(currentYear, 3, 15) },
    { clientId: 'client-003', taxYear: currentYear, type: 'BUSINESS_1120', status: 'NOT_STARTED', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-005', taxYear: currentYear, type: 'BUSINESS_1065', status: 'IN_PROGRESS', dueDate: new Date(currentYear + 1, 2, 15) },
    { clientId: 'client-006', taxYear: currentYear, type: 'INDIVIDUAL_1040', status: 'GATHERING_INFO', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-007', taxYear: currentYear, type: 'INDIVIDUAL_1040', status: 'IN_PROGRESS', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-008', taxYear: currentYear, type: 'BUSINESS_1120S', status: 'REVIEW', dueDate: new Date(currentYear + 1, 2, 15) },
    { clientId: 'client-009', taxYear: currentYear, type: 'INDIVIDUAL_1040', status: 'NOT_STARTED', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-010', taxYear: currentYear, type: 'BUSINESS_1065', status: 'IN_PROGRESS', dueDate: new Date(currentYear + 1, 2, 15) },
    { clientId: 'client-012', taxYear: currentYear, type: 'BUSINESS_1065', status: 'GATHERING_INFO', dueDate: new Date(currentYear + 1, 2, 15) },
    { clientId: 'client-013', taxYear: currentYear, type: 'BUSINESS_1065', status: 'IN_PROGRESS', dueDate: new Date(currentYear + 1, 2, 15) },
    { clientId: 'client-014', taxYear: currentYear, type: 'INDIVIDUAL_1040', status: 'GATHERING_INFO', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-016', taxYear: currentYear, type: 'INDIVIDUAL_1040', status: 'NOT_STARTED', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-017', taxYear: currentYear, type: 'INDIVIDUAL_1040', status: 'IN_PROGRESS', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-018', taxYear: currentYear, type: 'BUSINESS_1065', status: 'REVIEW', dueDate: new Date(currentYear + 1, 2, 15) },
    { clientId: 'client-019', taxYear: currentYear, type: 'INDIVIDUAL_1040', status: 'GATHERING_INFO', dueDate: new Date(currentYear + 1, 3, 15) },
    { clientId: 'client-020', taxYear: currentYear, type: 'BUSINESS_1120S', status: 'IN_PROGRESS', dueDate: new Date(currentYear + 1, 2, 15) },
    { clientId: 'client-003', taxYear: currentYear - 1, type: 'BUSINESS_1120', status: 'FILED', dueDate: new Date(currentYear, 3, 15) },
  ]

  for (const tr of taxReturns) {
    await prisma.taxReturn.upsert({
      where: { clientId_taxYear_type: { clientId: tr.clientId, taxYear: tr.taxYear, type: tr.type as 'INDIVIDUAL_1040' | 'BUSINESS_1120' | 'BUSINESS_1120S' | 'BUSINESS_1065' | 'NON_PROFIT_990' } },
      update: {},
      create: {
        ...tr,
        type: tr.type as 'INDIVIDUAL_1040' | 'BUSINESS_1120' | 'BUSINESS_1120S' | 'BUSINESS_1065' | 'NON_PROFIT_990',
        status: tr.status as 'NOT_STARTED' | 'GATHERING_INFO' | 'IN_PROGRESS' | 'REVIEW' | 'PENDING_CLIENT' | 'READY_TO_FILE' | 'FILED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED',
      },
    })
  }

  // Create 20+ tax deadlines
  const deadlines = [
    { id: 'deadline-001', name: 'Form 1040 Due Date', description: 'Individual tax returns due', type: 'INDIVIDUAL', dueDate: new Date(currentYear + 1, 3, 15), baseDate: new Date(currentYear + 1, 3, 15), reminderDays: [30, 14, 7, 1] },
    { id: 'deadline-002', name: 'S-Corp Returns (1120S)', description: 'S-Corporation returns due', type: 'BUSINESS', dueDate: new Date(currentYear + 1, 2, 15), baseDate: new Date(currentYear + 1, 2, 15), reminderDays: [30, 14, 7, 1] },
    { id: 'deadline-003', name: 'Partnership Returns (1065)', description: 'Partnership returns due', type: 'BUSINESS', dueDate: new Date(currentYear + 1, 2, 15), baseDate: new Date(currentYear + 1, 2, 15), reminderDays: [30, 14, 7, 1] },
    { id: 'deadline-004', name: 'Q1 Estimated Payments', description: 'First quarter estimated tax due', type: 'ESTIMATED', dueDate: new Date(currentYear + 1, 3, 15), baseDate: new Date(currentYear + 1, 3, 15), reminderDays: [14, 7, 1] },
    { id: 'deadline-005', name: 'Q2 Estimated Payments', description: 'Second quarter estimated tax due', type: 'ESTIMATED', dueDate: new Date(currentYear + 1, 5, 15), baseDate: new Date(currentYear + 1, 5, 15), reminderDays: [14, 7, 1] },
    { id: 'deadline-006', name: 'Q3 Estimated Payments', description: 'Third quarter estimated tax due', type: 'ESTIMATED', dueDate: new Date(currentYear + 1, 8, 15), baseDate: new Date(currentYear + 1, 8, 15), reminderDays: [14, 7, 1] },
    { id: 'deadline-007', name: 'Q4 Estimated Payments', description: 'Fourth quarter estimated tax due', type: 'ESTIMATED', dueDate: new Date(currentYear + 2, 0, 15), baseDate: new Date(currentYear + 2, 0, 15), reminderDays: [14, 7, 1] },
    { id: 'deadline-008', name: 'Form 1099 Filing', description: '1099 forms due to IRS', type: 'INFORMATION', dueDate: new Date(currentYear + 1, 1, 28), baseDate: new Date(currentYear + 1, 1, 28), reminderDays: [30, 14, 7] },
    { id: 'deadline-009', name: 'Form W-2 Filing', description: 'W-2 forms due to SSA', type: 'INFORMATION', dueDate: new Date(currentYear + 1, 0, 31), baseDate: new Date(currentYear + 1, 0, 31), reminderDays: [30, 14, 7] },
    { id: 'deadline-010', name: 'C-Corp Returns (1120)', description: 'C-Corporation returns due', type: 'BUSINESS', dueDate: new Date(currentYear + 1, 3, 15), baseDate: new Date(currentYear + 1, 3, 15), reminderDays: [30, 14, 7, 1] },
    { id: 'deadline-011', name: 'Form 941 - Q1', description: 'Quarterly payroll tax return', type: 'OTHER', dueDate: new Date(currentYear + 1, 3, 30), baseDate: new Date(currentYear + 1, 3, 30), reminderDays: [14, 7] },
    { id: 'deadline-012', name: 'Form 941 - Q2', description: 'Quarterly payroll tax return', type: 'OTHER', dueDate: new Date(currentYear + 1, 6, 31), baseDate: new Date(currentYear + 1, 6, 31), reminderDays: [14, 7] },
    { id: 'deadline-013', name: 'Form 941 - Q3', description: 'Quarterly payroll tax return', type: 'OTHER', dueDate: new Date(currentYear + 1, 9, 31), baseDate: new Date(currentYear + 1, 9, 31), reminderDays: [14, 7] },
    { id: 'deadline-014', name: 'Form 941 - Q4', description: 'Quarterly payroll tax return', type: 'OTHER', dueDate: new Date(currentYear + 2, 0, 31), baseDate: new Date(currentYear + 2, 0, 31), reminderDays: [14, 7] },
    { id: 'deadline-015', name: 'FBAR Filing', description: 'Foreign bank account reporting due', type: 'INDIVIDUAL', dueDate: new Date(currentYear + 1, 3, 15), baseDate: new Date(currentYear + 1, 3, 15), reminderDays: [30, 14, 7] },
    { id: 'deadline-016', name: 'Form 990', description: 'Non-profit returns due', type: 'BUSINESS', dueDate: new Date(currentYear + 1, 4, 15), baseDate: new Date(currentYear + 1, 4, 15), reminderDays: [30, 14, 7, 1] },
    { id: 'deadline-017', name: 'Extended 1040 Due', description: 'Extended individual returns due', type: 'INDIVIDUAL', dueDate: new Date(currentYear + 1, 9, 15), baseDate: new Date(currentYear + 1, 9, 15), reminderDays: [30, 14, 7, 1] },
    { id: 'deadline-018', name: 'Extended S-Corp Due', description: 'Extended S-Corp returns due', type: 'BUSINESS', dueDate: new Date(currentYear + 1, 8, 15), baseDate: new Date(currentYear + 1, 8, 15), reminderDays: [30, 14, 7, 1] },
    { id: 'deadline-019', name: 'Form 1099-NEC', description: 'Non-employee compensation forms due', type: 'INFORMATION', dueDate: new Date(currentYear + 1, 0, 31), baseDate: new Date(currentYear + 1, 0, 31), reminderDays: [30, 14, 7] },
    { id: 'deadline-020', name: 'State Sales Tax - Monthly', description: 'Monthly sales tax return', type: 'SALES_TAX', dueDate: new Date(currentYear + 1, 0, 20), baseDate: new Date(currentYear + 1, 0, 20), reminderDays: [7, 3] },
  ]

  for (const deadline of deadlines) {
    await prisma.taxDeadline.upsert({
      where: { id: deadline.id },
      update: {},
      create: deadline,
    })
  }

  // Create 25+ employees
  const employees = [
    { clientId: 'client-001', employeeNumber: 'EMP-0001', firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@acmecorp.com', status: 'ACTIVE', payType: 'SALARY', payRate: 75000, payFrequency: 'BI_WEEKLY', hireDate: new Date('2022-01-15') },
    { clientId: 'client-001', employeeNumber: 'EMP-0002', firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@acmecorp.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 25, payFrequency: 'BI_WEEKLY', hireDate: new Date('2023-03-01') },
    { clientId: 'client-001', employeeNumber: 'EMP-0003', firstName: 'James', lastName: 'Wilson', email: 'james.wilson@acmecorp.com', status: 'ACTIVE', payType: 'SALARY', payRate: 85000, payFrequency: 'BI_WEEKLY', hireDate: new Date('2021-06-15') },
    { clientId: 'client-001', employeeNumber: 'EMP-0004', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@acmecorp.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 22, payFrequency: 'WEEKLY', hireDate: new Date('2023-09-01') },
    { clientId: 'client-003', employeeNumber: 'EMP-0001', firstName: 'Alex', lastName: 'Turner', email: 'alex@techstartup.io', status: 'ACTIVE', payType: 'SALARY', payRate: 120000, payFrequency: 'SEMI_MONTHLY', hireDate: new Date('2023-01-10') },
    { clientId: 'client-003', employeeNumber: 'EMP-0002', firstName: 'Rachel', lastName: 'Lee', email: 'rachel@techstartup.io', status: 'ACTIVE', payType: 'SALARY', payRate: 95000, payFrequency: 'SEMI_MONTHLY', hireDate: new Date('2023-04-01') },
    { clientId: 'client-003', employeeNumber: 'EMP-0003', firstName: 'Kevin', lastName: 'Park', email: 'kevin@techstartup.io', status: 'ACTIVE', payType: 'SALARY', payRate: 110000, payFrequency: 'SEMI_MONTHLY', hireDate: new Date('2023-02-15') },
    { clientId: 'client-005', employeeNumber: 'EMP-0001', firstName: 'Carlos', lastName: 'Rodriguez', email: 'carlos@greengardens.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 18, payFrequency: 'WEEKLY', hireDate: new Date('2022-04-01') },
    { clientId: 'client-005', employeeNumber: 'EMP-0002', firstName: 'Maria', lastName: 'Santos', email: 'maria@greengardens.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 17, payFrequency: 'WEEKLY', hireDate: new Date('2022-06-15') },
    { clientId: 'client-007', employeeNumber: 'EMP-0001', firstName: 'Tony', lastName: 'Russo', email: 'tony@downtowndeli.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 16, payFrequency: 'WEEKLY', hireDate: new Date('2023-01-05') },
    { clientId: 'client-007', employeeNumber: 'EMP-0002', firstName: 'Lisa', lastName: 'Chen', email: 'lisa@downtowndeli.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 15, payFrequency: 'WEEKLY', hireDate: new Date('2023-05-20') },
    { clientId: 'client-008', employeeNumber: 'EMP-0001', firstName: 'David', lastName: 'Nguyen', email: 'david@pacificimports.com', status: 'ACTIVE', payType: 'SALARY', payRate: 65000, payFrequency: 'BI_WEEKLY', hireDate: new Date('2021-09-01') },
    { clientId: 'client-008', employeeNumber: 'EMP-0002', firstName: 'Jennifer', lastName: 'Wong', email: 'jennifer@pacificimports.com', status: 'ACTIVE', payType: 'SALARY', payRate: 72000, payFrequency: 'BI_WEEKLY', hireDate: new Date('2022-02-14') },
    { clientId: 'client-013', employeeNumber: 'EMP-0001', firstName: 'Dr. Steven', lastName: 'Miller', email: 'dr.miller@riversidemedical.com', status: 'ACTIVE', payType: 'SALARY', payRate: 250000, payFrequency: 'MONTHLY', hireDate: new Date('2019-01-01') },
    { clientId: 'client-013', employeeNumber: 'EMP-0002', firstName: 'Nurse Patricia', lastName: 'Adams', email: 'patricia@riversidemedical.com', status: 'ACTIVE', payType: 'SALARY', payRate: 75000, payFrequency: 'BI_WEEKLY', hireDate: new Date('2020-03-15') },
    { clientId: 'client-013', employeeNumber: 'EMP-0003', firstName: 'Admin Susan', lastName: 'Clark', email: 'susan@riversidemedical.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 20, payFrequency: 'BI_WEEKLY', hireDate: new Date('2021-07-01') },
    { clientId: 'client-012', employeeNumber: 'EMP-0001', firstName: 'Creative Jake', lastName: 'Morrison', email: 'jake@creativedesign.co', status: 'ACTIVE', payType: 'SALARY', payRate: 80000, payFrequency: 'SEMI_MONTHLY', hireDate: new Date('2022-08-01') },
    { clientId: 'client-017', employeeNumber: 'EMP-0001', firstName: 'Baker Tom', lastName: 'Baker', email: 'tom@sunshinebakery.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 19, payFrequency: 'WEEKLY', hireDate: new Date('2021-03-01') },
    { clientId: 'client-017', employeeNumber: 'EMP-0002', firstName: 'Assistant Mary', lastName: 'Jones', email: 'mary@sunshinebakery.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 15, payFrequency: 'WEEKLY', hireDate: new Date('2022-10-15') },
    { clientId: 'client-018', employeeNumber: 'EMP-0001', firstName: 'Consultant Mark', lastName: 'Thompson', email: 'mark@eliteconsulting.com', status: 'ACTIVE', payType: 'SALARY', payRate: 150000, payFrequency: 'MONTHLY', hireDate: new Date('2020-01-01') },
    { clientId: 'client-018', employeeNumber: 'EMP-0002', firstName: 'Analyst Kate', lastName: 'Williams', email: 'kate@eliteconsulting.com', status: 'ACTIVE', payType: 'SALARY', payRate: 90000, payFrequency: 'BI_WEEKLY', hireDate: new Date('2021-04-15') },
    { clientId: 'client-020', employeeNumber: 'EMP-0001', firstName: 'Driver Pete', lastName: 'Jackson', email: 'pete@northernlogistics.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 24, payFrequency: 'WEEKLY', hireDate: new Date('2020-06-01') },
    { clientId: 'client-020', employeeNumber: 'EMP-0002', firstName: 'Driver Sam', lastName: 'Roberts', email: 'sam@northernlogistics.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 23, payFrequency: 'WEEKLY', hireDate: new Date('2021-02-15') },
    { clientId: 'client-020', employeeNumber: 'EMP-0003', firstName: 'Dispatcher Amy', lastName: 'Foster', email: 'amy@northernlogistics.com', status: 'ACTIVE', payType: 'SALARY', payRate: 55000, payFrequency: 'BI_WEEKLY', hireDate: new Date('2022-05-01') },
    { clientId: 'client-020', employeeNumber: 'EMP-0004', firstName: 'Mechanic Joe', lastName: 'Wright', email: 'joe@northernlogistics.com', status: 'ACTIVE', payType: 'HOURLY', payRate: 28, payFrequency: 'WEEKLY', hireDate: new Date('2019-08-15') },
  ]

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { clientId_employeeNumber: { clientId: emp.clientId, employeeNumber: emp.employeeNumber } },
      update: {},
      create: {
        ...emp,
        status: emp.status as 'ACTIVE' | 'TERMINATED' | 'ON_LEAVE',
        payType: emp.payType as 'HOURLY' | 'SALARY',
        payFrequency: emp.payFrequency as 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY',
      },
    })
  }

  // Create 15+ payroll runs
  const payrollRuns = [
    { id: 'payroll-001', clientId: 'client-001', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-15'), payDate: new Date('2024-11-20'), status: 'COMPLETED', totalGross: 12500.00, totalNet: 9375.00, totalTaxes: 3125.00, employeeCount: 4 },
    { id: 'payroll-002', clientId: 'client-001', payPeriodStart: new Date('2024-10-16'), payPeriodEnd: new Date('2024-10-31'), payDate: new Date('2024-11-05'), status: 'COMPLETED', totalGross: 12500.00, totalNet: 9375.00, totalTaxes: 3125.00, employeeCount: 4 },
    { id: 'payroll-003', clientId: 'client-003', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-15'), payDate: new Date('2024-11-15'), status: 'COMPLETED', totalGross: 13541.67, totalNet: 10156.25, totalTaxes: 3385.42, employeeCount: 3 },
    { id: 'payroll-004', clientId: 'client-005', payPeriodStart: new Date('2024-11-04'), payPeriodEnd: new Date('2024-11-10'), payDate: new Date('2024-11-15'), status: 'COMPLETED', totalGross: 2800.00, totalNet: 2380.00, totalTaxes: 420.00, employeeCount: 2 },
    { id: 'payroll-005', clientId: 'client-007', payPeriodStart: new Date('2024-11-04'), payPeriodEnd: new Date('2024-11-10'), payDate: new Date('2024-11-15'), status: 'COMPLETED', totalGross: 2480.00, totalNet: 2108.00, totalTaxes: 372.00, employeeCount: 2 },
    { id: 'payroll-006', clientId: 'client-008', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-15'), payDate: new Date('2024-11-20'), status: 'PROCESSING', totalGross: 5269.23, totalNet: 4488.85, totalTaxes: 780.38, employeeCount: 2 },
    { id: 'payroll-007', clientId: 'client-013', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-30'), payDate: new Date('2024-11-30'), status: 'PENDING_APPROVAL', totalGross: 27083.33, totalNet: 20312.50, totalTaxes: 6770.83, employeeCount: 3 },
    { id: 'payroll-008', clientId: 'client-012', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-15'), payDate: new Date('2024-11-15'), status: 'COMPLETED', totalGross: 3333.33, totalNet: 2833.33, totalTaxes: 500.00, employeeCount: 1 },
    { id: 'payroll-009', clientId: 'client-017', payPeriodStart: new Date('2024-11-04'), payPeriodEnd: new Date('2024-11-10'), payDate: new Date('2024-11-15'), status: 'COMPLETED', totalGross: 2720.00, totalNet: 2312.00, totalTaxes: 408.00, employeeCount: 2 },
    { id: 'payroll-010', clientId: 'client-018', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-30'), payDate: new Date('2024-11-30'), status: 'PENDING_APPROVAL', totalGross: 20000.00, totalNet: 15000.00, totalTaxes: 5000.00, employeeCount: 2 },
    { id: 'payroll-011', clientId: 'client-020', payPeriodStart: new Date('2024-11-04'), payPeriodEnd: new Date('2024-11-10'), payDate: new Date('2024-11-15'), status: 'COMPLETED', totalGross: 7880.00, totalNet: 6698.00, totalTaxes: 1182.00, employeeCount: 4 },
    { id: 'payroll-012', clientId: 'client-001', payPeriodStart: new Date('2024-09-16'), payPeriodEnd: new Date('2024-09-30'), payDate: new Date('2024-10-05'), status: 'COMPLETED', totalGross: 12500.00, totalNet: 9375.00, totalTaxes: 3125.00, employeeCount: 4 },
    { id: 'payroll-013', clientId: 'client-003', payPeriodStart: new Date('2024-10-16'), payPeriodEnd: new Date('2024-10-31'), payDate: new Date('2024-10-31'), status: 'COMPLETED', totalGross: 13541.67, totalNet: 10156.25, totalTaxes: 3385.42, employeeCount: 3 },
    { id: 'payroll-014', clientId: 'client-020', payPeriodStart: new Date('2024-10-28'), payPeriodEnd: new Date('2024-11-03'), payDate: new Date('2024-11-08'), status: 'COMPLETED', totalGross: 7880.00, totalNet: 6698.00, totalTaxes: 1182.00, employeeCount: 4 },
    { id: 'payroll-015', clientId: 'client-005', payPeriodStart: new Date('2024-10-28'), payPeriodEnd: new Date('2024-11-03'), payDate: new Date('2024-11-08'), status: 'COMPLETED', totalGross: 2800.00, totalNet: 2380.00, totalTaxes: 420.00, employeeCount: 2 },
  ]

  for (const pr of payrollRuns) {
    await prisma.payrollRun.upsert({
      where: { id: pr.id },
      update: {},
      create: {
        ...pr,
        status: pr.status as 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'VOID',
        createdById: 'user-001',
      },
    })
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })

  // Create 20+ tasks
  const tasks = [
    { id: 'task-001', title: 'Review Q4 financials', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), clientId: 'client-001' },
    { id: 'task-002', title: 'Prepare tax organizer', priority: 'MEDIUM', status: 'TODO', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), clientId: 'client-002' },
    { id: 'task-003', title: 'Follow up on documents', priority: 'LOW', status: 'TODO', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), clientId: 'client-003' },
    { id: 'task-004', title: 'Bank reconciliation', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), clientId: 'client-001' },
    { id: 'task-005', title: 'Review payroll reports', priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), clientId: 'client-005' },
    { id: 'task-006', title: 'Prepare 1099s', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), clientId: 'client-008' },
    { id: 'task-007', title: 'Client onboarding meeting', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), clientId: 'client-015' },
    { id: 'task-008', title: 'Quarterly review call', priority: 'MEDIUM', status: 'TODO', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), clientId: 'client-010' },
    { id: 'task-009', title: 'Update depreciation schedule', priority: 'LOW', status: 'TODO', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), clientId: 'client-013' },
    { id: 'task-010', title: 'Review inventory valuation', priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), clientId: 'client-007' },
    { id: 'task-011', title: 'File sales tax return', priority: 'URGENT', status: 'TODO', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), clientId: 'client-017' },
    { id: 'task-012', title: 'Audit preparation', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), clientId: 'client-018' },
    { id: 'task-013', title: 'Review contractor payments', priority: 'MEDIUM', status: 'COMPLETED', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), clientId: 'client-012' },
    { id: 'task-014', title: 'Prepare financial statements', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), clientId: 'client-020' },
    { id: 'task-015', title: 'Year-end adjustments', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), clientId: 'client-001' },
    { id: 'task-016', title: 'Review lease agreements', priority: 'LOW', status: 'TODO', dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), clientId: 'client-010' },
    { id: 'task-017', title: 'Update entity documents', priority: 'MEDIUM', status: 'TODO', dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), clientId: 'client-005' },
    { id: 'task-018', title: 'Prepare extension request', priority: 'URGENT', status: 'TODO', dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), clientId: 'client-003' },
    { id: 'task-019', title: 'Review insurance coverage', priority: 'LOW', status: 'COMPLETED', dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), clientId: 'client-008' },
    { id: 'task-020', title: 'Client document collection', priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), clientId: 'client-006' },
  ]

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        ...task,
        priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        status: task.status as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED',
        assignedToId: admin?.id,
      },
    })
  }

  // Create 20+ time entries
  const timeEntries = [
    { id: 'time-001', date: new Date(), hours: 2.5, description: 'Tax return preparation', isBillable: true, rate: 175, amount: 437.50, status: 'DRAFT', userId: 'user-001' },
    { id: 'time-002', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), hours: 3.0, description: 'Client meeting - quarterly review', isBillable: true, rate: 175, amount: 525.00, status: 'APPROVED', userId: 'user-001' },
    { id: 'time-003', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), hours: 1.5, description: 'Bank reconciliation', isBillable: true, rate: 150, amount: 225.00, status: 'BILLED', userId: 'user-002' },
    { id: 'time-004', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), hours: 4.0, description: 'Financial statement preparation', isBillable: true, rate: 175, amount: 700.00, status: 'DRAFT', userId: 'user-003' },
    { id: 'time-005', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), hours: 2.0, description: 'Payroll processing', isBillable: true, rate: 150, amount: 300.00, status: 'APPROVED', userId: 'user-004' },
    { id: 'time-006', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), hours: 1.0, description: 'Document review', isBillable: true, rate: 125, amount: 125.00, status: 'DRAFT', userId: 'user-005' },
    { id: 'time-007', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), hours: 3.5, description: 'Audit preparation', isBillable: true, rate: 200, amount: 700.00, status: 'BILLED', userId: 'user-006' },
    { id: 'time-008', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), hours: 2.0, description: 'Staff training', isBillable: false, rate: 0, amount: 0, status: 'APPROVED', userId: 'user-001' },
    { id: 'time-009', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), hours: 4.5, description: 'Tax research', isBillable: true, rate: 175, amount: 787.50, status: 'DRAFT', userId: 'user-007' },
    { id: 'time-010', date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), hours: 1.5, description: 'Email correspondence', isBillable: false, rate: 0, amount: 0, status: 'APPROVED', userId: 'user-008' },
    { id: 'time-011', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), hours: 3.0, description: '1099 preparation', isBillable: true, rate: 150, amount: 450.00, status: 'BILLED', userId: 'user-002' },
    { id: 'time-012', date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), hours: 2.5, description: 'Quarterly estimates', isBillable: true, rate: 175, amount: 437.50, status: 'APPROVED', userId: 'user-003' },
    { id: 'time-013', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), hours: 1.0, description: 'Phone consultation', isBillable: true, rate: 175, amount: 175.00, status: 'DRAFT', userId: 'user-004' },
    { id: 'time-014', date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), hours: 5.0, description: 'Year-end closing', isBillable: true, rate: 175, amount: 875.00, status: 'BILLED', userId: 'user-005' },
    { id: 'time-015', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), hours: 2.0, description: 'Entity formation', isBillable: true, rate: 200, amount: 400.00, status: 'APPROVED', userId: 'user-006' },
    { id: 'time-016', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), hours: 3.5, description: 'Sales tax filing', isBillable: true, rate: 150, amount: 525.00, status: 'DRAFT', userId: 'user-007' },
    { id: 'time-017', date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), hours: 1.5, description: 'Internal meeting', isBillable: false, rate: 0, amount: 0, status: 'APPROVED', userId: 'user-008' },
    { id: 'time-018', date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), hours: 4.0, description: 'Business valuation', isBillable: true, rate: 250, amount: 1000.00, status: 'BILLED', userId: 'user-001' },
    { id: 'time-019', date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), hours: 2.5, description: 'Bookkeeping review', isBillable: true, rate: 125, amount: 312.50, status: 'APPROVED', userId: 'user-002' },
    { id: 'time-020', date: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000), hours: 3.0, description: 'Financial analysis', isBillable: true, rate: 175, amount: 525.00, status: 'DRAFT', userId: 'user-003' },
  ]

  for (const entry of timeEntries) {
    await prisma.timeEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        ...entry,
        status: entry.status as 'DRAFT' | 'APPROVED' | 'BILLED',
      },
    })
  }

  // Create 15+ invoices
  const invoices = [
    { id: 'inv-001', invoiceNumber: 'INV-1001', clientId: 'client-001', issueDate: new Date('2024-11-01'), dueDate: new Date('2024-12-01'), subtotal: 2500.00, taxRate: 0, taxAmount: 0, total: 2500.00, paidAmount: 2500.00, status: 'PAID' },
    { id: 'inv-002', invoiceNumber: 'INV-1002', clientId: 'client-002', issueDate: new Date('2024-11-05'), dueDate: new Date('2024-12-05'), subtotal: 1750.00, taxRate: 0, taxAmount: 0, total: 1750.00, paidAmount: 0, status: 'SENT' },
    { id: 'inv-003', invoiceNumber: 'INV-1003', clientId: 'client-003', issueDate: new Date('2024-11-10'), dueDate: new Date('2024-12-10'), subtotal: 5000.00, taxRate: 0, taxAmount: 0, total: 5000.00, paidAmount: 5000.00, status: 'PAID' },
    { id: 'inv-004', invoiceNumber: 'INV-1004', clientId: 'client-005', issueDate: new Date('2024-11-12'), dueDate: new Date('2024-12-12'), subtotal: 1200.00, taxRate: 0, taxAmount: 0, total: 1200.00, paidAmount: 0, status: 'DRAFT' },
    { id: 'inv-005', invoiceNumber: 'INV-1005', clientId: 'client-006', issueDate: new Date('2024-10-15'), dueDate: new Date('2024-11-15'), subtotal: 875.00, taxRate: 0, taxAmount: 0, total: 875.00, paidAmount: 0, status: 'OVERDUE' },
    { id: 'inv-006', invoiceNumber: 'INV-1006', clientId: 'client-007', issueDate: new Date('2024-11-15'), dueDate: new Date('2024-12-15'), subtotal: 650.00, taxRate: 0, taxAmount: 0, total: 650.00, paidAmount: 325.00, status: 'PARTIAL' },
    { id: 'inv-007', invoiceNumber: 'INV-1007', clientId: 'client-008', issueDate: new Date('2024-11-18'), dueDate: new Date('2024-12-18'), subtotal: 3500.00, taxRate: 0, taxAmount: 0, total: 3500.00, paidAmount: 0, status: 'SENT' },
    { id: 'inv-008', invoiceNumber: 'INV-1008', clientId: 'client-010', issueDate: new Date('2024-11-20'), dueDate: new Date('2024-12-20'), subtotal: 4200.00, taxRate: 0, taxAmount: 0, total: 4200.00, paidAmount: 4200.00, status: 'PAID' },
    { id: 'inv-009', invoiceNumber: 'INV-1009', clientId: 'client-012', issueDate: new Date('2024-11-22'), dueDate: new Date('2024-12-22'), subtotal: 950.00, taxRate: 0, taxAmount: 0, total: 950.00, paidAmount: 0, status: 'DRAFT' },
    { id: 'inv-010', invoiceNumber: 'INV-1010', clientId: 'client-013', issueDate: new Date('2024-10-01'), dueDate: new Date('2024-11-01'), subtotal: 7500.00, taxRate: 0, taxAmount: 0, total: 7500.00, paidAmount: 0, status: 'OVERDUE' },
    { id: 'inv-011', invoiceNumber: 'INV-1011', clientId: 'client-017', issueDate: new Date('2024-11-25'), dueDate: new Date('2024-12-25'), subtotal: 525.00, taxRate: 0, taxAmount: 0, total: 525.00, paidAmount: 0, status: 'SENT' },
    { id: 'inv-012', invoiceNumber: 'INV-1012', clientId: 'client-018', issueDate: new Date('2024-11-01'), dueDate: new Date('2024-12-01'), subtotal: 12000.00, taxRate: 0, taxAmount: 0, total: 12000.00, paidAmount: 12000.00, status: 'PAID' },
    { id: 'inv-013', invoiceNumber: 'INV-1013', clientId: 'client-019', issueDate: new Date('2024-11-28'), dueDate: new Date('2024-12-28'), subtotal: 450.00, taxRate: 0, taxAmount: 0, total: 450.00, paidAmount: 0, status: 'DRAFT' },
    { id: 'inv-014', invoiceNumber: 'INV-1014', clientId: 'client-020', issueDate: new Date('2024-11-15'), dueDate: new Date('2024-12-15'), subtotal: 8750.00, taxRate: 0, taxAmount: 0, total: 8750.00, paidAmount: 4375.00, status: 'PARTIAL' },
    { id: 'inv-015', invoiceNumber: 'INV-1015', clientId: 'client-001', issueDate: new Date('2024-10-15'), dueDate: new Date('2024-11-15'), subtotal: 3200.00, taxRate: 0, taxAmount: 0, total: 3200.00, paidAmount: 3200.00, status: 'PAID' },
  ]

  for (const inv of invoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
      create: {
        ...inv,
        status: inv.status as 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID',
        firmId: firm.id,
        createdById: 'user-001',
      },
    })
  }

  // Create 20+ documents
  const documents = [
    { id: 'doc-001', name: 'W-2 Form 2024', type: 'W2', category: 'Tax Documents', fileSize: 245000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-001' },
    { id: 'doc-002', name: '1099-INT Statement', type: 'W2', category: 'Tax Documents', fileSize: 125000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-001' },
    { id: 'doc-003', name: 'Bank Statement Nov 2024', type: 'BANK_STATEMENT', category: 'Financial', fileSize: 567000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-001' },
    { id: 'doc-004', name: 'Profit & Loss Statement', type: 'FINANCIAL_STATEMENT', category: 'Financial', fileSize: 345000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-003' },
    { id: 'doc-005', name: 'Articles of Incorporation', type: 'OTHER', category: 'Legal', fileSize: 890000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-003' },
    { id: 'doc-006', name: 'Insurance Certificate', type: 'OTHER', category: 'Insurance', fileSize: 234000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-005' },
    { id: 'doc-007', name: 'Payroll Summary Q3', type: 'OTHER', category: 'Payroll', fileSize: 456000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-001' },
    { id: 'doc-008', name: 'Tax Return 2023', type: 'TAX_RETURN', category: 'Tax Documents', fileSize: 1234000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-002' },
    { id: 'doc-009', name: 'Receipt - Office Supplies', type: 'RECEIPT', category: 'Expenses', fileSize: 89000, mimeType: 'image/jpeg', status: 'APPROVED', clientId: 'client-007' },
    { id: 'doc-010', name: 'Lease Agreement', type: 'CONTRACT', category: 'Legal', fileSize: 678000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-010' },
    { id: 'doc-011', name: 'Balance Sheet Q4', type: 'FINANCIAL_STATEMENT', category: 'Financial', fileSize: 234000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-008' },
    { id: 'doc-012', name: 'Employee Handbook', type: 'OTHER', category: 'HR', fileSize: 2345000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-020' },
    { id: 'doc-013', name: 'Vendor Contract', type: 'CONTRACT', category: 'Legal', fileSize: 456000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-008' },
    { id: 'doc-014', name: 'Medical License', type: 'OTHER', category: 'Legal', fileSize: 123000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-013' },
    { id: 'doc-015', name: 'Depreciation Schedule', type: 'FINANCIAL_STATEMENT', category: 'Financial', fileSize: 345000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-001' },
    { id: 'doc-016', name: 'Bank Statement Oct 2024', type: 'BANK_STATEMENT', category: 'Financial', fileSize: 543000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-003' },
    { id: 'doc-017', name: 'Health Insurance Policy', type: 'OTHER', category: 'Insurance', fileSize: 789000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-018' },
    { id: 'doc-018', name: 'Quarterly Tax Payment', type: 'W2', category: 'Tax Documents', fileSize: 156000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-006' },
    { id: 'doc-019', name: 'Operating Agreement', type: 'OTHER', category: 'Legal', fileSize: 567000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-005' },
    { id: 'doc-020', name: 'Client Engagement Letter', type: 'CONTRACT', category: 'Legal', fileSize: 234000, mimeType: 'application/pdf', status: 'APPROVED', clientId: 'client-015' },
  ]

  for (const doc of documents) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: {},
      create: {
        ...doc,
        type: doc.type as 'TAX_RETURN' | 'FINANCIAL_STATEMENT' | 'BANK_STATEMENT' | 'RECEIPT' | 'INVOICE' | 'CONTRACT' | 'ENGAGEMENT_LETTER' | 'W2' | 'W9' | 'FORM_1099' | 'K1' | 'OTHER',
        status: doc.status as 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SIGNED' | 'ARCHIVED',
        fileUrl: `/documents/${doc.id}`,
        uploadedById: 'user-001',
      },
    })
  }

  // Create integrations
  const integrations = [
    { id: 'int-001', type: 'QUICKBOOKS', status: 'CONNECTED', lastSyncAt: new Date() },
    { id: 'int-002', type: 'PLAID', status: 'DISCONNECTED', lastSyncAt: null },
    { id: 'int-003', type: 'STRIPE', status: 'CONNECTED', lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: 'int-004', type: 'DOCUSIGN', status: 'CONNECTED', lastSyncAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'int-005', type: 'GUSTO', status: 'CONNECTING', lastSyncAt: null },
  ]

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { id: integration.id },
      update: {},
      create: {
        ...integration,
        type: integration.type as 'QUICKBOOKS' | 'XERO' | 'PLAID' | 'STRIPE' | 'DOCUSIGN' | 'GUSTO',
        status: integration.status as 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR',
        firmId: firm.id,
        settings: {},
      },
    })
  }

  // Create report templates
  const reportTemplates = [
    { id: 'report-001', name: 'Payroll Summary', description: 'Summary of payroll for the period', category: 'PAYROLL', isSystem: true },
    { id: 'report-002', name: 'Tax Liability', description: 'Tax liability breakdown by type', category: 'PAYROLL', isSystem: true },
    { id: 'report-003', name: 'W-2 Preview', description: 'Preview of W-2 forms for employees', category: 'PAYROLL', isSystem: true },
    { id: 'report-004', name: '941 Quarterly', description: 'Quarterly 941 payroll tax report', category: 'PAYROLL', isSystem: true },
    { id: 'report-005', name: 'Employee Earnings', description: 'Detailed earnings report per employee', category: 'PAYROLL', isSystem: true },
    { id: 'report-006', name: 'Deductions Report', description: 'Breakdown of all payroll deductions', category: 'PAYROLL', isSystem: true },
    { id: 'report-007', name: 'Tax Summary', description: 'Summary of tax return status', category: 'TAX', isSystem: true },
    { id: 'report-008', name: 'Client Tax Organizer', description: 'Tax organizer checklist by client', category: 'TAX', isSystem: true },
    { id: 'report-009', name: 'Profit & Loss', description: 'Income statement report', category: 'FINANCIAL', isSystem: true },
    { id: 'report-010', name: 'Balance Sheet', description: 'Statement of financial position', category: 'FINANCIAL', isSystem: true },
    { id: 'report-011', name: 'Cash Flow', description: 'Statement of cash flows', category: 'FINANCIAL', isSystem: true },
    { id: 'report-012', name: 'Accounts Receivable Aging', description: 'Aging of outstanding receivables', category: 'FINANCIAL', isSystem: true },
    { id: 'report-013', name: 'Client List', description: 'Complete list of clients', category: 'CLIENT', isSystem: true },
    { id: 'report-014', name: 'Time & Billing', description: 'Summary of time entries and billing', category: 'PRACTICE', isSystem: true },
    { id: 'report-015', name: 'Invoice Aging', description: 'Aging of outstanding invoices', category: 'PRACTICE', isSystem: true },
  ]

  for (const template of reportTemplates) {
    await prisma.reportTemplate.upsert({
      where: { id: template.id },
      update: {},
      create: {
        ...template,
        category: template.category as 'PAYROLL' | 'TAX' | 'FINANCIAL' | 'CLIENT' | 'PRACTICE',
        firmId: firm.id,
      },
    })
  }

  // Create document request templates
  const documentRequestTemplates = [
    { id: 'docreq-001', name: 'W-2 Forms', description: 'Wage and tax statements from employers', category: 'Income', sortOrder: 1 },
    { id: 'docreq-002', name: 'Bank Statements', description: 'Monthly bank account statements', category: 'Financial', sortOrder: 2 },
    { id: 'docreq-003', name: '1099 Forms', description: 'Various 1099 income forms', category: 'Income', sortOrder: 3 },
    { id: 'docreq-004', name: 'Receipts', description: 'Business expense receipts', category: 'Expenses', sortOrder: 4 },
    { id: 'docreq-005', name: 'Prior Year Tax Return', description: 'Copy of last year tax return', category: 'Tax', sortOrder: 5 },
    { id: 'docreq-006', name: 'Mortgage Interest Statement (1098)', description: 'Mortgage interest paid', category: 'Deductions', sortOrder: 6 },
    { id: 'docreq-007', name: 'Property Tax Records', description: 'Real estate tax payments', category: 'Deductions', sortOrder: 7 },
    { id: 'docreq-008', name: 'Charitable Donations', description: 'Records of charitable contributions', category: 'Deductions', sortOrder: 8 },
    { id: 'docreq-009', name: 'Medical Expenses', description: 'Healthcare expense records', category: 'Deductions', sortOrder: 9 },
    { id: 'docreq-010', name: 'Business Expenses', description: 'Business-related expense documentation', category: 'Expenses', sortOrder: 10 },
    { id: 'docreq-011', name: 'Investment Statements', description: 'Brokerage and investment account statements', category: 'Income', sortOrder: 11 },
    { id: 'docreq-012', name: 'K-1 Forms', description: 'Partnership or S-Corp income statements', category: 'Income', sortOrder: 12 },
    { id: 'docreq-013', name: 'Vehicle Mileage Log', description: 'Business mileage records', category: 'Expenses', sortOrder: 13 },
    { id: 'docreq-014', name: 'Home Office Documentation', description: 'Home office expense records', category: 'Expenses', sortOrder: 14 },
    { id: 'docreq-015', name: 'Health Insurance (1095)', description: 'Health insurance coverage forms', category: 'Tax', sortOrder: 15 },
  ]

  for (const template of documentRequestTemplates) {
    await prisma.documentRequestTemplate.upsert({
      where: { id: template.id },
      update: {},
      create: {
        ...template,
        isSystem: true,
        firmId: firm.id,
      },
    })
  }

  // Create tax checklist templates
  const taxChecklistTemplates = [
    { id: 'taxcl-001', name: 'W-2 Forms', description: 'All W-2 forms from employers', category: 'Income', isRequired: true },
    { id: 'taxcl-002', name: '1099 Forms', description: 'All 1099 income forms (INT, DIV, MISC, NEC, etc.)', category: 'Income', isRequired: true },
    { id: 'taxcl-003', name: 'K-1 Forms', description: 'K-1 forms from partnerships or S-Corps', category: 'Income', isRequired: false },
    { id: 'taxcl-004', name: 'Social Security Benefits', description: 'SSA-1099 for Social Security income', category: 'Income', isRequired: false },
    { id: 'taxcl-005', name: 'Retirement Distributions', description: '1099-R for retirement account distributions', category: 'Income', isRequired: false },
    { id: 'taxcl-006', name: 'Mortgage Interest (1098)', description: 'Form 1098 for mortgage interest', category: 'Deductions', isRequired: false },
    { id: 'taxcl-007', name: 'Property Taxes', description: 'Property tax payment records', category: 'Deductions', isRequired: false },
    { id: 'taxcl-008', name: 'Charitable Contributions', description: 'Donation receipts and records', category: 'Deductions', isRequired: false },
    { id: 'taxcl-009', name: 'Medical Expenses', description: 'Medical expense records', category: 'Deductions', isRequired: false },
    { id: 'taxcl-010', name: 'State Tax Payments', description: 'State income tax payments made', category: 'Deductions', isRequired: false },
    { id: 'taxcl-011', name: 'Health Insurance (1095)', description: 'Health coverage forms', category: 'Other', isRequired: true },
    { id: 'taxcl-012', name: 'Bank Account Info', description: 'Bank info for direct deposit/withdrawal', category: 'Other', isRequired: true },
    { id: 'taxcl-013', name: 'Prior Year Return', description: 'Copy of prior year tax return', category: 'Other', isRequired: true },
    { id: 'taxcl-014', name: 'Identity Documents', description: 'SSN/ITIN for all family members', category: 'Other', isRequired: true },
    { id: 'taxcl-015', name: 'Estimated Payments', description: 'Records of estimated tax payments made', category: 'Payments', isRequired: false },
  ]

  for (const template of taxChecklistTemplates) {
    await prisma.taxChecklistTemplate.upsert({
      where: { id: template.id },
      update: {},
      create: {
        ...template,
        isActive: true,
        sortOrder: parseInt(template.id.split('-')[1]),
        firmId: firm.id,
      },
    })
  }

  // Service Items
  const serviceItems = [
    { id: 'svc-001', name: 'Tax Preparation - Individual 1040', description: 'Individual tax return preparation', defaultRate: 350.00, category: 'Tax Services' },
    { id: 'svc-002', name: 'Tax Preparation - Business 1120', description: 'C-Corporation tax return', defaultRate: 850.00, category: 'Tax Services' },
    { id: 'svc-003', name: 'Tax Preparation - Business 1120S', description: 'S-Corporation tax return', defaultRate: 750.00, category: 'Tax Services' },
    { id: 'svc-004', name: 'Tax Preparation - Partnership 1065', description: 'Partnership tax return', defaultRate: 800.00, category: 'Tax Services' },
    { id: 'svc-005', name: 'Monthly Bookkeeping', description: 'Monthly bookkeeping services', defaultRate: 500.00, category: 'Bookkeeping' },
    { id: 'svc-006', name: 'Quarterly Bookkeeping', description: 'Quarterly bookkeeping catch-up', defaultRate: 1200.00, category: 'Bookkeeping' },
    { id: 'svc-007', name: 'Payroll Processing (per pay period)', description: 'Payroll processing service', defaultRate: 125.00, category: 'Payroll' },
    { id: 'svc-008', name: 'QuickBooks Setup', description: 'Initial QuickBooks setup and training', defaultRate: 600.00, category: 'Consulting' },
    { id: 'svc-009', name: 'Financial Statement Preparation', description: 'Monthly financial statements', defaultRate: 400.00, category: 'Accounting' },
    { id: 'svc-010', name: 'Tax Planning Consultation', description: 'Tax planning and strategy session', defaultRate: 250.00, category: 'Tax Services' },
    { id: 'svc-011', name: 'IRS Audit Representation', description: 'IRS audit representation (hourly)', defaultRate: 300.00, category: 'Tax Services' },
    { id: 'svc-012', name: 'Business Formation', description: 'LLC/Corporation formation services', defaultRate: 750.00, category: 'Consulting' },
    { id: 'svc-013', name: 'CFO Services (Monthly)', description: 'Part-time CFO services', defaultRate: 2500.00, category: 'Consulting' },
    { id: 'svc-014', name: 'Sales Tax Filing', description: 'Sales tax return preparation and filing', defaultRate: 150.00, category: 'Tax Services' },
    { id: 'svc-015', name: 'Bank Reconciliation', description: 'Monthly bank reconciliation', defaultRate: 150.00, category: 'Bookkeeping' },
    { id: 'svc-016', name: 'Accounts Payable Management', description: 'AP processing and management', defaultRate: 300.00, category: 'Bookkeeping' },
    { id: 'svc-017', name: 'Accounts Receivable Management', description: 'AR processing and collections', defaultRate: 300.00, category: 'Bookkeeping' },
    { id: 'svc-018', name: 'Year-End Tax Package', description: 'Year-end tax planning package', defaultRate: 500.00, category: 'Tax Services' },
  ]

  for (const item of serviceItems) {
    await prisma.serviceItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        firmId: firm.id,
      },
    })
  }

  // Create 15+ engagements
  const engagements = [
    { id: 'eng-001', name: '2024 Tax Preparation', type: 'TAX_PREPARATION', status: 'ACTIVE', startDate: new Date('2024-01-15'), clientId: 'client-001', budgetHours: 40, budgetAmount: 7000 },
    { id: 'eng-002', name: 'Monthly Bookkeeping', type: 'BOOKKEEPING', status: 'ACTIVE', startDate: new Date('2024-01-01'), clientId: 'client-001', budgetHours: 120, budgetAmount: 18000 },
    { id: 'eng-003', name: '2024 Individual Tax', type: 'TAX_PREPARATION', status: 'ACTIVE', startDate: new Date('2024-02-01'), clientId: 'client-002', budgetHours: 15, budgetAmount: 2625 },
    { id: 'eng-004', name: 'Tech Startup Audit', type: 'AUDIT', status: 'ACTIVE', startDate: new Date('2024-06-01'), clientId: 'client-003', budgetHours: 80, budgetAmount: 16000 },
    { id: 'eng-005', name: 'Quarterly Bookkeeping', type: 'BOOKKEEPING', status: 'ACTIVE', startDate: new Date('2024-01-01'), clientId: 'client-005', budgetHours: 60, budgetAmount: 7200 },
    { id: 'eng-006', name: 'Payroll Services', type: 'PAYROLL', status: 'ACTIVE', startDate: new Date('2024-01-01'), clientId: 'client-007', budgetHours: 24, budgetAmount: 3000 },
    { id: 'eng-007', name: 'Tax Planning', type: 'CONSULTING', status: 'ACTIVE', startDate: new Date('2024-03-01'), clientId: 'client-008', budgetHours: 20, budgetAmount: 4000 },
    { id: 'eng-008', name: 'Financial Planning', type: 'FINANCIAL_PLANNING', status: 'ACTIVE', startDate: new Date('2024-04-01'), clientId: 'client-010', budgetHours: 30, budgetAmount: 6000 },
    { id: 'eng-009', name: 'Medical Practice Bookkeeping', type: 'BOOKKEEPING', status: 'ACTIVE', startDate: new Date('2024-01-01'), clientId: 'client-013', budgetHours: 100, budgetAmount: 15000 },
    { id: 'eng-010', name: 'Tax Preparation 2024', type: 'TAX_PREPARATION', status: 'ACTIVE', startDate: new Date('2024-02-15'), clientId: 'client-012', budgetHours: 12, budgetAmount: 2100 },
    { id: 'eng-011', name: 'Business Consulting', type: 'CONSULTING', status: 'ACTIVE', startDate: new Date('2024-05-01'), clientId: 'client-018', budgetHours: 40, budgetAmount: 10000 },
    { id: 'eng-012', name: 'Payroll Setup', type: 'PAYROLL', status: 'COMPLETED', startDate: new Date('2024-01-15'), endDate: new Date('2024-03-01'), clientId: 'client-020', budgetHours: 16, budgetAmount: 2400 },
    { id: 'eng-013', name: '2024 Tax Filing', type: 'TAX_PREPARATION', status: 'ACTIVE', startDate: new Date('2024-01-10'), clientId: 'client-006', budgetHours: 10, budgetAmount: 1750 },
    { id: 'eng-014', name: 'Annual Bookkeeping', type: 'BOOKKEEPING', status: 'ACTIVE', startDate: new Date('2024-01-01'), clientId: 'client-017', budgetHours: 48, budgetAmount: 6000 },
    { id: 'eng-015', name: '2024 Tax Preparation', type: 'TAX_PREPARATION', status: 'ACTIVE', startDate: new Date('2024-02-01'), clientId: 'client-014', budgetHours: 8, budgetAmount: 1400 },
    { id: 'eng-016', name: 'Year-End Review', type: 'CONSULTING', status: 'ACTIVE', startDate: new Date('2024-11-01'), clientId: 'client-003', budgetHours: 20, budgetAmount: 5000 },
  ]

  for (const eng of engagements) {
    await prisma.engagement.upsert({
      where: { id: eng.id },
      update: {},
      create: {
        ...eng,
        type: eng.type as 'TAX_PREPARATION' | 'BOOKKEEPING' | 'PAYROLL' | 'AUDIT' | 'CONSULTING' | 'FINANCIAL_PLANNING' | 'OTHER',
        status: eng.status as 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
      },
    })
  }

  // Create 15+ notes
  const notes = [
    { id: 'note-001', content: 'Client requested extension for 2024 tax return. Need to file Form 4868 by April 15.', clientId: 'client-001', createdById: 'user-001', isPinned: true },
    { id: 'note-002', content: 'Discussed year-end tax planning strategies. Client interested in maximizing retirement contributions.', clientId: 'client-002', createdById: 'user-001' },
    { id: 'note-003', content: 'Tech Startup raised Series B funding. Need to review equity compensation implications.', clientId: 'client-003', createdById: 'user-002', isPinned: true },
    { id: 'note-004', content: 'Prospect meeting scheduled for next week. Interested in full-service bookkeeping.', clientId: 'client-004', createdById: 'user-001' },
    { id: 'note-005', content: 'Green Gardens expanding operations. May need to upgrade from LLC to S-Corp.', clientId: 'client-005', createdById: 'user-003' },
    { id: 'note-006', content: 'Michael Chen considering purchasing rental property. Tax implications discussion needed.', clientId: 'client-006', createdById: 'user-001' },
    { id: 'note-007', content: 'Deli owner wants to add catering service line. Need new revenue tracking.', clientId: 'client-007', createdById: 'user-004' },
    { id: 'note-008', content: 'Import duties increased Q4. Client needs to review product pricing strategy.', clientId: 'client-008', createdById: 'user-002' },
    { id: 'note-009', content: 'Jennifer Martinez got married. Need to update filing status for next year.', clientId: 'client-009', createdById: 'user-001' },
    { id: 'note-010', content: 'Property management company considering 1031 exchange for downtown property.', clientId: 'client-010', createdById: 'user-003', isPinned: true },
    { id: 'note-011', content: 'David Kim account inactive since Q2. Send reactivation outreach email.', clientId: 'client-011', createdById: 'user-001' },
    { id: 'note-012', content: 'Creative Design Studio hired 3 new contractors. Need 1099 tracking setup.', clientId: 'client-012', createdById: 'user-005' },
    { id: 'note-013', content: 'Medical group added new physician partner. Update partnership agreement and allocation.', clientId: 'client-013', createdById: 'user-002', isPinned: true },
    { id: 'note-014', content: 'Amanda moving to Texas. No state income tax implications starting next year.', clientId: 'client-014', createdById: 'user-001' },
    { id: 'note-015', content: 'Future Robotics Corp seeking R&D tax credits. Schedule consultation with tax specialist.', clientId: 'client-015', createdById: 'user-006' },
    { id: 'note-016', content: 'Elite Consulting had record quarter. May need estimated tax adjustment.', clientId: 'client-018', createdById: 'user-003' },
  ]

  for (const note of notes) {
    await prisma.note.upsert({
      where: { id: note.id },
      update: {},
      create: {
        ...note,
        isPinned: note.isPinned || false,
      },
    })
  }

  // Create 15+ client contacts
  const clientContacts = [
    { id: 'contact-001', firstName: 'Tom', lastName: 'Acme', title: 'CFO', email: 'tom@acmecorp.com', phone: '(555) 111-0001', isPrimary: true, clientId: 'client-001' },
    { id: 'contact-002', firstName: 'Sandra', lastName: 'Acme', title: 'CEO', email: 'sandra@acmecorp.com', phone: '(555) 111-0002', clientId: 'client-001' },
    { id: 'contact-003', firstName: 'Jessica', lastName: 'Turner', title: 'CTO', email: 'jess@techstartup.io', phone: '(555) 555-0001', isPrimary: true, clientId: 'client-003' },
    { id: 'contact-004', firstName: 'Brian', lastName: 'Lee', title: 'Controller', email: 'brian@techstartup.io', phone: '(555) 555-0002', clientId: 'client-003' },
    { id: 'contact-005', firstName: 'Carmen', lastName: 'Verde', title: 'Owner', email: 'carmen@greengardens.com', phone: '(555) 123-0001', isPrimary: true, clientId: 'client-005' },
    { id: 'contact-006', firstName: 'Marco', lastName: 'DeliOwner', title: 'Owner', email: 'marco@downtowndeli.com', phone: '(555) 345-0001', isPrimary: true, clientId: 'client-007' },
    { id: 'contact-007', firstName: 'Yuki', lastName: 'Tanaka', title: 'Import Manager', email: 'yuki@pacificimports.com', phone: '(555) 456-0001', isPrimary: true, clientId: 'client-008' },
    { id: 'contact-008', firstName: 'Henry', lastName: 'Pacific', title: 'President', email: 'henry@pacificimports.com', phone: '(555) 456-0002', clientId: 'client-008' },
    { id: 'contact-009', firstName: 'George', lastName: 'Mountain', title: 'Managing Partner', email: 'george@mvproperties.com', phone: '(555) 678-0001', isPrimary: true, clientId: 'client-010' },
    { id: 'contact-010', firstName: 'Helen', lastName: 'Creek', title: 'Bookkeeper', email: 'helen@mvproperties.com', phone: '(555) 678-0002', clientId: 'client-010' },
    { id: 'contact-011', firstName: 'Dr. James', lastName: 'Riverside', title: 'Managing Partner', email: 'drjames@riversidemedical.com', phone: '(555) 901-0001', isPrimary: true, clientId: 'client-013' },
    { id: 'contact-012', firstName: 'Nancy', lastName: 'Billing', title: 'Billing Manager', email: 'nancy@riversidemedical.com', phone: '(555) 901-0002', clientId: 'client-013' },
    { id: 'contact-013', firstName: 'Viktor', lastName: 'Robot', title: 'Founder', email: 'viktor@futurerobotics.io', phone: '(555) 234-0001', isPrimary: true, clientId: 'client-015' },
    { id: 'contact-014', firstName: 'Diana', lastName: 'Baker', title: 'Owner', email: 'diana@sunshinebakery.com', phone: '(555) 456-0003', isPrimary: true, clientId: 'client-017' },
    { id: 'contact-015', firstName: 'Richard', lastName: 'Elite', title: 'Managing Director', email: 'richard@eliteconsulting.com', phone: '(555) 567-0001', isPrimary: true, clientId: 'client-018' },
    { id: 'contact-016', firstName: 'Frank', lastName: 'Northern', title: 'Operations Director', email: 'frank@northernlogistics.com', phone: '(555) 789-0001', isPrimary: true, clientId: 'client-020' },
  ]

  for (const contact of clientContacts) {
    await prisma.clientContact.upsert({
      where: { id: contact.id },
      update: {},
      create: {
        ...contact,
        isPrimary: contact.isPrimary || false,
      },
    })
  }

  console.log('')
  console.log('=========================================')
  console.log('Seed data created successfully!')
  console.log('=========================================')
  console.log('')
  console.log('Data created:')
  console.log('  - 16 Users (emailVerified)')
  console.log('  - 40 Chart of Accounts')
  console.log('  - 20 Clients')
  console.log('  - 16 Client Contacts')
  console.log('  - 16 Engagements')
  console.log('  - 16 Notes')
  console.log('  - 20 Bank Accounts')
  console.log('  - 30 Transactions')
  console.log('  - 20 Tax Returns')
  console.log('  - 20 Tax Deadlines')
  console.log('  - 25 Employees')
  console.log('  - 15 Payroll Runs')
  console.log('  - 20 Tasks')
  console.log('  - 20 Time Entries')
  console.log('  - 15 Invoices')
  console.log('  - 20 Documents')
  console.log('  - 5 Integrations')
  console.log('  - 15 Report Templates')
  console.log('  - 15 Document Request Templates')
  console.log('  - 15 Tax Checklist Templates')
  console.log('  - 18 Service Items')
  console.log('')
  console.log('Demo Credentials:')
  console.log('  Email: admin@example.com')
  console.log('  Password: password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
