'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  FileText,
  BookOpen,
  Receipt,
  DollarSign,
  BarChart3,
  Briefcase,
  Settings,
  Home,
  CreditCard,
  Calendar,
  Link as LinkIcon,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Bookkeeping', href: '/dashboard/bookkeeping', icon: BookOpen },
  { name: 'Tax Preparation', href: '/dashboard/tax', icon: Receipt },
  { name: 'Payroll', href: '/dashboard/payroll', icon: CreditCard },
  { name: 'Financial Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Client Profitability', href: '/dashboard/client-profitability', icon: DollarSign },
  { name: 'Practice Management', href: '/dashboard/practice', icon: Briefcase },
  { name: 'Integrations', href: '/dashboard/integrations', icon: LinkIcon },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-secondary-900 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-secondary-800">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-white">FinanceAI</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-secondary-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="border-t border-secondary-800 p-4">
            <p className="text-xs text-secondary-500 text-center">
              Financial Services AI Platform
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
