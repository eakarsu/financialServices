'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="mb-6">
          <div className="inline-block p-4 bg-primary-100 rounded-full mb-4">
            <Search className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-6xl font-bold text-secondary-900">404</h1>
          <h2 className="text-2xl font-semibold text-secondary-900 mt-4">Page Not Found</h2>
          <p className="text-secondary-600 mt-4 max-w-md mx-auto">
            The page you're looking for doesn't exist or may have been moved to a different location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/dashboard">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-secondary-200">
          <p className="text-sm text-secondary-500">
            Common pages:
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            <Link href="/dashboard/clients">
              <span className="text-sm text-primary-600 hover:underline">Clients</span>
            </Link>
            <span className="text-secondary-300">•</span>
            <Link href="/dashboard/documents">
              <span className="text-sm text-primary-600 hover:underline">Documents</span>
            </Link>
            <span className="text-secondary-300">•</span>
            <Link href="/dashboard/bookkeeping">
              <span className="text-sm text-primary-600 hover:underline">Bookkeeping</span>
            </Link>
            <span className="text-secondary-300">•</span>
            <Link href="/dashboard/tax">
              <span className="text-sm text-primary-600 hover:underline">Tax</span>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
