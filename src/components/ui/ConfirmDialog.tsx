'use client'

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import Button from './Button'

type Variant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: Variant
  loading?: boolean
}

const variantConfig: Record<Variant, { icon: typeof AlertTriangle; iconColor: string; buttonVariant: 'danger' | 'primary' | 'secondary' }> = {
  danger: { icon: AlertTriangle, iconColor: 'text-red-500', buttonVariant: 'danger' },
  warning: { icon: AlertCircle, iconColor: 'text-yellow-500', buttonVariant: 'primary' },
  info: { icon: Info, iconColor: 'text-blue-500', buttonVariant: 'primary' },
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full bg-opacity-10 ${config.iconColor}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
            <p className="mt-2 text-sm text-secondary-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={config.buttonVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
