import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { parsePaginationParams, buildPaginatedResponse } from '@/lib/pagination'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client')

    const pagination = parsePaginationParams(request, 'payDate')

    const where: Record<string, unknown> = {
      client: { firmId: user.firmId },
    }

    if (clientId) where.clientId = clientId

    const [payrollRuns, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          client: true,
          createdBy: { select: { firstName: true, lastName: true } },
          items: {
            include: { employee: true },
          },
        },
      }),
      prisma.payrollRun.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(payrollRuns, total, pagination))
  } catch (error) {
    console.error('Get payroll runs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// 2024 Federal income tax withholding — annualised bracket method
// (IRS Publication 15-T, Percentage Method Tables for Automated Payroll Systems)
// Brackets below are for a SINGLE filer with 0 allowances (most conservative).
// A production system should use the employee's W-4 filing status; this
// implementation uses Single as the default and accepts an optional override.
// ---------------------------------------------------------------------------

const SOCIAL_SECURITY_WAGE_BASE_2024 = 168_600 // IRS 2024 SS wage base
const SOCIAL_SECURITY_RATE = 0.062
const MEDICARE_RATE = 0.0145
const ADDITIONAL_MEDICARE_RATE = 0.009 // applies above $200k (single) / $250k (MFJ)
const ADDITIONAL_MEDICARE_THRESHOLD = 200_000

// 2024 single-filer tax brackets (taxable annual income → marginal rate + base tax)
interface TaxBracket {
  min: number
  max: number
  rate: number
  baseTax: number
}

const FEDERAL_BRACKETS_2024_SINGLE: TaxBracket[] = [
  { min: 0,       max: 11_600,  rate: 0.10, baseTax: 0 },
  { min: 11_600,  max: 47_150,  rate: 0.12, baseTax: 1_160 },
  { min: 47_150,  max: 100_525, rate: 0.22, baseTax: 5_426 },
  { min: 100_525, max: 191_950, rate: 0.24, baseTax: 17_168.5 },
  { min: 191_950, max: 243_725, rate: 0.32, baseTax: 39_110.5 },
  { min: 243_725, max: 609_350, rate: 0.35, baseTax: 55_678.5 },
  { min: 609_350, max: Infinity, rate: 0.37, baseTax: 183_647 },
]

// 2024 married-filing-jointly brackets
const FEDERAL_BRACKETS_2024_MFJ: TaxBracket[] = [
  { min: 0,       max: 23_200,  rate: 0.10, baseTax: 0 },
  { min: 23_200,  max: 94_300,  rate: 0.12, baseTax: 2_320 },
  { min: 94_300,  max: 201_050, rate: 0.22, baseTax: 10_852 },
  { min: 201_050, max: 383_900, rate: 0.24, baseTax: 34_337 },
  { min: 383_900, max: 487_450, rate: 0.32, baseTax: 78_221 },
  { min: 487_450, max: 731_200, rate: 0.35, baseTax: 111_357 },
  { min: 731_200, max: Infinity, rate: 0.37, baseTax: 196_669.5 },
]

/**
 * Calculate annual federal income tax using the bracket method.
 * @param annualGross  Annualised gross wages (gross pay × pay-periods per year)
 * @param filingStatus "SINGLE" | "MARRIED" — defaults to SINGLE
 */
function calculateAnnualFederalTax(annualGross: number, filingStatus = 'SINGLE'): number {
  const brackets =
    filingStatus === 'MARRIED' ? FEDERAL_BRACKETS_2024_MFJ : FEDERAL_BRACKETS_2024_SINGLE

  for (const bracket of brackets) {
    if (annualGross <= bracket.max) {
      return bracket.baseTax + (annualGross - bracket.min) * bracket.rate
    }
  }
  // Shouldn't reach here — last bracket has max: Infinity
  return annualGross * 0.37
}

/** Pay-periods per year by pay frequency */
const PAY_PERIODS: Record<string, number> = {
  WEEKLY: 52,
  BI_WEEKLY: 26,
  SEMI_MONTHLY: 24,
  MONTHLY: 12,
}

interface EmployeePayInput {
  employeeId: string
  regularHours: number
  overtimeHours: number
  payRate: number
  payFrequency?: string   // WEEKLY | BI_WEEKLY | SEMI_MONTHLY | MONTHLY
  filingStatus?: string   // SINGLE | MARRIED
  ytdSocialSecurityWages?: number  // year-to-date SS wages to enforce the wage base cap
  additionalWithholding?: number   // additional withholding per period (from W-4 Step 4c)
  stateCode?: string
  stateWithholdingAmount: number
  stateWithholdingAuthority: string
}

/**
 * Compute gross pay, withholdings, and net pay for one employee payroll period.
 * Returns all the fields needed to create a PayrollItem record.
 */
function calculateEmployeePayroll(emp: EmployeePayInput) {
  const regularPay = emp.regularHours * emp.payRate
  const overtimePay = emp.overtimeHours * emp.payRate * 1.5
  const grossPay = regularPay + overtimePay

  const payPeriodsPerYear = PAY_PERIODS[emp.payFrequency || 'BI_WEEKLY'] ?? 26

  // ---- Federal income tax (annualise → compute annual tax → de-annualise) ----
  const annualGross = grossPay * payPeriodsPerYear
  const annualFederalTax = calculateAnnualFederalTax(annualGross, emp.filingStatus || 'SINGLE')
  const federalTax = Math.max(0, annualFederalTax / payPeriodsPerYear)

  // ---- FICA: Social Security ----
  const ytdSS = emp.ytdSocialSecurityWages ?? 0
  const ssEligible = Math.max(0, Math.min(grossPay, SOCIAL_SECURITY_WAGE_BASE_2024 - ytdSS))
  const socialSecurity = ssEligible * SOCIAL_SECURITY_RATE

  // ---- FICA: Medicare (with additional Medicare tax above $200k annualised) ----
  const annualMedicareWages = grossPay * payPeriodsPerYear
  let medicare = grossPay * MEDICARE_RATE
  if (annualMedicareWages > ADDITIONAL_MEDICARE_THRESHOLD) {
    const excessAnnual = annualMedicareWages - ADDITIONAL_MEDICARE_THRESHOLD
    medicare += (excessAnnual / payPeriodsPerYear) * ADDITIONAL_MEDICARE_RATE
  }

  // State withholding is accepted only as evidence from an authoritative
  // payroll/tax table integration; this app never invents a fallback rate.
  if (!Number.isFinite(emp.stateWithholdingAmount) || emp.stateWithholdingAmount < 0 || !emp.stateWithholdingAuthority?.trim()) {
    throw new Error('Authoritative state withholding amount and authority are required')
  }
  const stateTax = emp.stateWithholdingAmount

  // ---- Additional withholding (W-4 Step 4c) ----
  const additionalWithholding = emp.additionalWithholding ?? 0

  const totalTaxWithheld = federalTax + stateTax + socialSecurity + medicare + additionalWithholding
  const netPay = grossPay - totalTaxWithheld

  return {
    employeeId: emp.employeeId,
    regularHours: emp.regularHours,
    overtimeHours: emp.overtimeHours,
    regularPay,
    overtimePay,
    grossPay,
    federalTax: parseFloat(federalTax.toFixed(2)),
    stateTax: parseFloat(stateTax.toFixed(2)),
    socialSecurity: parseFloat(socialSecurity.toFixed(2)),
    medicare: parseFloat(medicare.toFixed(2)),
    otherDeductions: parseFloat(additionalWithholding.toFixed(2)),
    netPay: parseFloat(Math.max(0, netPay).toFixed(2)),
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.firmId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, payPeriodStart, payPeriodEnd, payDate, employees } = await request.json()

    if (!clientId || !payPeriodStart || !payPeriodEnd || !payDate || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'Client, pay-period dates, pay date, and employees are required' }, { status: 400 })
    }

    const client = await prisma.client.findFirst({ where: { id: clientId, firmId: user.firmId }, select: { id: true } })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (employees.some((employee: Partial<EmployeePayInput>) =>
      !Number.isFinite(employee.stateWithholdingAmount) ||
      (employee.stateWithholdingAmount as number) < 0 ||
      !employee.stateWithholdingAuthority?.trim()
    )) {
      return NextResponse.json({
        error: 'Each employee requires an authoritative state withholding amount and source',
      }, { status: 422 })
    }

    const items = (employees as EmployeePayInput[]).map((emp) => calculateEmployeePayroll(emp))

    const totals = items.reduce((acc: { gross: number; net: number; taxes: number }, item: { grossPay: number; netPay: number; federalTax: number; stateTax: number; socialSecurity: number; medicare: number }) => ({
      gross: acc.gross + item.grossPay,
      net: acc.net + item.netPay,
      taxes: acc.taxes + item.federalTax + item.stateTax + item.socialSecurity + item.medicare,
    }), { gross: 0, net: 0, taxes: 0 })

    const payrollRun = await prisma.payrollRun.create({
      data: {
        clientId,
        createdById: user.id,
        payPeriodStart: new Date(payPeriodStart),
        payPeriodEnd: new Date(payPeriodEnd),
        payDate: new Date(payDate),
        status: 'DRAFT',
        totalGross: totals.gross,
        totalNet: totals.net,
        totalTaxes: totals.taxes,
        totalDeductions: 0,
        employeeCount: items.length,
        items: {
          create: items,
        },
      },
      include: {
        client: true,
        items: { include: { employee: true } },
      },
    })

    return NextResponse.json(payrollRun)
  } catch (error) {
    console.error('Create payroll run error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
