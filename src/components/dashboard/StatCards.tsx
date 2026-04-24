'use client'

import { useRouter } from 'next/navigation'
import { Users, FileText, DollarSign, Clock, LucideIcon } from 'lucide-react'
import Card, { CardContent } from '@/components/ui/Card'

interface StatCard {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  color: string
  bgColor: string
  href: string
}

interface StatCardsProps {
  stats: {
    clientCount: number
    activeClients: number
    documentCount: number
    totalRevenue: string
    pendingRevenue: string
    pendingTasks: number
  }
}

export default function StatCards({ stats }: StatCardsProps) {
  const router = useRouter()

  const cards: StatCard[] = [
    {
      title: 'Total Clients',
      value: stats.clientCount,
      subtitle: `${stats.activeClients} active`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/dashboard/clients',
    },
    {
      title: 'Documents',
      value: stats.documentCount,
      subtitle: 'Total files',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/dashboard/documents',
    },
    {
      title: 'Revenue',
      value: stats.totalRevenue,
      subtitle: `${stats.pendingRevenue} pending`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      href: '/dashboard/practice',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      subtitle: 'Tasks to complete',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/dashboard/practice',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((stat) => (
        <Card
          key={stat.title}
          variant="bordered"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(stat.href)}
        >
          <CardContent className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-secondary-500">{stat.title}</p>
              <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
              <p className="text-xs text-secondary-400">{stat.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
