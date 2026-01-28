'use client'

import { useEffect } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="mb-6">
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Something Went Wrong</h1>
          <p className="text-secondary-600 mt-4 max-w-md mx-auto">
            An error occurred while loading this page. Please try again or contact support if the issue persists.
          </p>
          {error.message && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-lg mx-auto">
              <p className="text-sm text-red-800 font-mono text-left">{error.message}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <Button onClick={() => reset()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>

        {error.digest && (
          <div className="mt-8 pt-8 border-t border-secondary-200">
            <p className="text-sm text-secondary-500">
              Error ID: {error.digest}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
