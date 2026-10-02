'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DollarSign } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingDemoCredentials, setLoadingDemoCredentials] = useState(false)
  const { toast } = useToast()

  const handleFillDemoCredentials = async () => {
    setError('')
    setLoadingDemoCredentials(true)

    try {
      const res = await fetch('/api/auth/demo-credentials', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Demo credentials are unavailable')
      }

      setEmail(data.email)
      setPassword(data.password)
      const __login = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.email, password: data.password }) });
      if (!__login.ok) { setError('Invalid email or password'); return; }
      window.location.assign('/');
      toast('Demo credentials filled', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo credentials are unavailable'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoadingDemoCredentials(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      toast('Welcome back!', 'success')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      toast(message, 'error')
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
            Financial Services AI
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <div className="mt-1 text-right">
                <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              loading={loadingDemoCredentials}
              onClick={handleFillDemoCredentials}
            >
              Auto Fill Demo Credentials
            </Button>

            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Create one
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
