'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-4">
        <p className="text-sm text-secondary-600">
          Showing <span className="font-medium">{total > 0 ? start : 0}</span> to{' '}
          <span className="font-medium">{end}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </p>
        {onLimitChange && (
          <select
            value={limit}
            onChange={e => onLimitChange(Number(e.target.value))}
            className="text-sm border border-secondary-300 rounded-md px-2 py-1"
          >
            {[10, 20, 50, 100].map(n => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md hover:bg-secondary-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md hover:bg-secondary-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-3 py-1 text-sm text-secondary-700">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md hover:bg-secondary-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md hover:bg-secondary-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
