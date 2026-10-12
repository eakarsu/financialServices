import { createReadinessAdvice } from '@/lib/readiness-advice'
export const runtime = 'nodejs'
export const { GET, POST } = createReadinessAdvice()
