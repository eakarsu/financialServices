import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    feature: 'Client Profitability',
    summary: { realizationRate: 86, unbilledWip: 18400, lowMarginClients: 4, pricingActions: 3 },
    clients: [
      { name: 'Aster Manufacturing', revenue: 42000, margin: 34, issue: 'Write-downs on monthly close' },
      { name: 'Northstar Clinic', revenue: 28500, margin: 18, issue: 'Scope creep on payroll support' },
      { name: 'Cedar Retail Group', revenue: 51200, margin: 41, issue: 'Healthy recurring package' },
    ],
    actions: [
      'Convert repeated advisory time into fixed-fee service items.',
      'Escalate clients below 25 percent gross margin for repricing review.',
      'Compare unbilled WIP to engagement letter scope before month-end billing.',
    ],
  })
}
