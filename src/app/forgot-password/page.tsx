'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DollarSign, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setSent(true)
      toast('Password reset link sent to your email', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Request failed', 'error')
    } finally {
      setLoading(false)
    }
  }

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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
                If an account with that email exists, we&apos;ve sent a password reset link.
                Please check your email.
              </div>
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />

              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}

          {!sent && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
