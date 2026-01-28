'use client'

import { Fragment, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  }

  return (
    <Fragment>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />
          <div
            className={cn(
              'relative w-full transform rounded-xl bg-white p-6 shadow-xl transition-all',
              sizes[size]
            )}
          >
            {(title || showClose) && (
              <div className="flex items-start justify-between mb-4">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
                  )}
                  {description && (
                    <p className="text-sm text-secondary-500 mt-1">{description}</p>
                  )}
                </div>
                {showClose && (
                  <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  )
}
