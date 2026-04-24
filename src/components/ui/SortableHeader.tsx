'use client'

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface SortableHeaderProps {
  label: string
  sortKey: string
  currentSortBy: string
  currentSortOrder: 'asc' | 'desc'
  onSort: (sortBy: string) => void
  className?: string
}

export default function SortableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSortBy === sortKey

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:text-secondary-700 select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentSortOrder === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </span>
    </th>
  )
}
