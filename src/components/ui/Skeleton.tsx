'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-secondary-200 rounded', className)} />
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      <div className="flex gap-4 mb-4 border-b border-secondary-200 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 py-3 border-b border-secondary-100">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-secondary-200 rounded-xl p-6">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-secondary-200 rounded-xl p-6 flex items-center">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="ml-4 flex-1">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  )
}
