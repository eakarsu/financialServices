import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import StatCards from '@/components/dashboard/StatCards'
import { formatCurrency, formatDate, parseDecimal } from '@/lib/utils'
import {
  Calendar,
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardData(firmId: string) {
  const [
    clientCount,
    activeClients,
    documentCount,
    pendingTasks,
    recentTransactions,
    upcomingDeadlines,
    recentInvoices,
    timeEntries,
  ] = await Promise.all([
    prisma.client.count({ where: { firmId } }),
    prisma.client.count({ where: { firmId, status: 'ACTIVE' } }),
    prisma.document.count({ where: { client: { firmId } } }),
    prisma.task.count({ where: { client: { firmId }, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
    prisma.transaction.findMany({
      where: { client: { firmId } },
      orderBy: { date: 'desc' },
      take: 5,
      include: { client: true, category: true },
    }),
    prisma.taxDeadline.findMany({
      where: { dueDate: { gte: new Date() } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { firmId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { client: true },
    }),
    prisma.timeEntry.findMany({
      where: { user: { firmId } },
      orderBy: { date: 'desc' },
      take: 5,
      include: { user: true },
    }),
  ])

  const totalRevenue = recentInvoices.reduce((sum, inv) => sum + parseDecimal(inv.paidAmount), 0)
  const pendingRevenue = recentInvoices.reduce((sum, inv) => sum + (parseDecimal(inv.total) - parseDecimal(inv.paidAmount)), 0)

  return {
    stats: {
      clientCount,
      activeClients,
      documentCount,
      pendingTasks,
      totalRevenue: formatCurrency(totalRevenue),
      pendingRevenue: formatCurrency(pendingRevenue),
    },
    recentTransactions,
    upcomingDeadlines,
    recentInvoices,
    timeEntries,
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user?.firmId) return null

  const data = await getDashboardData(user.firmId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-secondary-600">Here&apos;s what&apos;s happening with your practice today.</p>
      </div>

      {/* Stats Grid - Clickable */}
      <StatCards stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Link href="/dashboard/bookkeeping" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-secondary-500 text-sm">No recent transactions</p>
            ) : (
              <div className="space-y-3">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{tx.description}</p>
                      <p className="text-xs text-secondary-500">
                        {tx.client?.businessName || `${tx.client?.firstName} ${tx.client?.lastName}`} • {formatDate(tx.date)}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(parseDecimal(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <Link href="/dashboard/practice" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentInvoices.length === 0 ? (
              <p className="text-secondary-500 text-sm">No recent invoices</p>
            ) : (
              <div className="space-y-3">
                {data.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-secondary-500">
                        {invoice.client?.businessName || `${invoice.client?.firstName} ${invoice.client?.lastName}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-secondary-900">{formatCurrency(parseDecimal(invoice.total))}</p>
                      <Badge variant={
                        invoice.status === 'PAID' ? 'success' :
                        invoice.status === 'OVERDUE' ? 'danger' :
                        invoice.status === 'SENT' ? 'info' : 'default'
                      } size="sm">
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Deadlines</CardTitle>
              <Link href="/dashboard/calendar" className="text-sm text-primary-600 hover:text-primary-700">
                View calendar
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingDeadlines.length === 0 ? (
              <p className="text-secondary-500 text-sm">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center py-2 border-b border-secondary-100 last:border-0">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <Calendar className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900">{deadline.name}</p>
                      <p className="text-xs text-secondary-500">{deadline.description}</p>
                    </div>
                    <span className="text-sm text-secondary-600">{formatDate(deadline.dueDate)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Time Entries */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Time Entries</CardTitle>
              <Link href="/dashboard/practice" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.timeEntries.length === 0 ? (
              <p className="text-secondary-500 text-sm">No recent time entries</p>
            ) : (
              <div className="space-y-3">
                {data.timeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{entry.description}</p>
                      <p className="text-xs text-secondary-500">
                        {entry.user.firstName} {entry.user.lastName} • {formatDate(entry.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-secondary-900">{parseDecimal(entry.hours).toFixed(1)}h</p>
                      <Badge variant={entry.isBillable ? 'success' : 'default'} size="sm">
                        {entry.isBillable ? 'Billable' : 'Non-billable'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
