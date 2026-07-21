'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DollarSign, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Verification failed')
        }

        setStatus('success')
        setMessage('Your email has been verified successfully!')
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    verify()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Email Verification
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-primary-600 mx-auto animate-spin" />
              <p className="text-secondary-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-secondary-700">{message}</p>
              <Link href="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-secondary-700">{message}</p>
              <Link href="/login">
                <Button variant="outline" className="w-full">Back to Login</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Verifying email…</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
