'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Search, Filter, Receipt, Calendar, FileCheck, Clock, AlertTriangle,
  CheckCircle, XCircle, ArrowRight, FileText
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ExportButton from '@/components/ExportButton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate, formatCurrency, parseDecimal } from '@/lib/utils'

interface TaxReturn {
  id: string
  taxYear: number
  type: string
  status: string
  filingStatus?: string
  dueDate?: string
  extendedDueDate?: string
  filedDate?: string
  estimatedRefund?: string
  estimatedOwed?: string
  client: { id: string; businessName?: string; firstName?: string; lastName?: string }
  checklistItems: Array<{ id: string; name: string; category: string; isRequired: boolean; isReceived: boolean }>
}

interface TaxDeadline {
  id: string
  name: string
  description?: string
  type: string
  dueDate: string
}

interface Client {
  id: string
  businessName?: string
  firstName?: string
  lastName?: string
}

const returnTypes = [
  { value: 'INDIVIDUAL_1040', label: 'Individual (1040)' },
  { value: 'BUSINESS_1120', label: 'C Corporation (1120)' },
  { value: 'BUSINESS_1120S', label: 'S Corporation (1120S)' },
  { value: 'BUSINESS_1065', label: 'Partnership (1065)' },
  { value: 'NON_PROFIT_990', label: 'Non-Profit (990)' },
  { value: 'TRUST_1041', label: 'Trust (1041)' },
]

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  NOT_STARTED: 'default',
  GATHERING_INFO: 'info',
  IN_PROGRESS: 'info',
  REVIEW: 'warning',
  PENDING_CLIENT: 'warning',
  READY_TO_FILE: 'success',
  FILED: 'success',
  ACCEPTED: 'success',
  REJECTED: 'danger',
}

export default function TaxPage() {
  const router = useRouter()
  const [returns, setReturns] = useState<TaxReturn[]>([])
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<TaxReturn | null>(null)

  const [formData, setFormData] = useState({
    clientId: '',
    taxYear: new Date().getFullYear(),
    type: 'INDIVIDUAL_1040',
  })

  useEffect(() => {
    fetchData()
  }, [yearFilter, statusFilter])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (yearFilter !== 'all') params.set('year', yearFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const [returnsRes, deadlinesRes, clientsRes] = await Promise.all([
        fetch(`/api/tax/returns?${params}`),
        fetch('/api/tax/deadlines?upcoming=true'),
        fetch('/api/clients'),
      ])

      setReturns(await returnsRes.json())
      setDeadlines(await deadlinesRes.json())
      setClients(await clientsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/tax/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      setShowModal(false)
      setFormData({
        clientId: '',
        taxYear: new Date().getFullYear(),
        type: 'INDIVIDUAL_1040',
      })
      fetchData()
    } catch (error) {
      console.error('Error creating tax return:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getClientName = (client?: Client) => {
    if (!client) return '-'
    return client.businessName || `${client.firstName} ${client.lastName}`
  }

  const getChecklistProgress = (items: TaxReturn['checklistItems']) => {
    const received = items.filter(i => i.isReceived).length
    return { received, total: items.length, percentage: items.length ? Math.round((received / items.length) * 100) : 0 }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const stats = {
    total: returns.length,
    inProgress: returns.filter(r => ['GATHERING_INFO', 'IN_PROGRESS', 'REVIEW'].includes(r.status)).length,
    readyToFile: returns.filter(r => r.status === 'READY_TO_FILE').length,
    filed: returns.filter(r => ['FILED', 'ACCEPTED'].includes(r.status)).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Tax Preparation</h1>
          <p className="text-secondary-600">Manage tax returns and deadlines</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            endpoint="/api/reports/export/tax-returns"
            label="Export"
            filters={{
              taxYear: yearFilter !== 'all' ? yearFilter : undefined,
              status: statusFilter !== 'all' ? statusFilter : undefined,
            }}
            variant="button"
          />
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Tax Return
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Returns</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">In Progress</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <FileCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Ready to File</p>
              <p className="text-2xl font-bold">{stats.readyToFile}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Filed</p>
              <p className="text-2xl font-bold">{stats.filed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Returns */}
        <div className="lg:col-span-2">
          <Card variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tax Returns</CardTitle>
                <div className="flex gap-2">
                  <Select
                    options={[{ value: 'all', label: 'All Years' }, ...years.map(y => ({
                      value: y.toString(),
                      label: y.toString(),
                    }))]}
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-32"
                  />
                  <Select
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'NOT_STARTED', label: 'Not Started' },
                      { value: 'IN_PROGRESS', label: 'In Progress' },
                      { value: 'READY_TO_FILE', label: 'Ready to File' },
                      { value: 'FILED', label: 'Filed' },
                    ]}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8">Loading...</p>
              ) : returns.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                  <p className="text-secondary-500">No tax returns found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {returns.map((taxReturn) => {
                    const progress = getChecklistProgress(taxReturn.checklistItems)
                    return (
                      <div
                        key={taxReturn.id}
                        className="p-4 border border-secondary-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedReturn(taxReturn)
                          setShowDetailsModal(true)
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-secondary-100 rounded-lg mr-3">
                              <FileText className="h-5 w-5 text-secondary-600" />
                            </div>
                            <div>
                              <p className="font-medium">{getClientName(taxReturn.client)}</p>
                              <p className="text-sm text-secondary-500">
                                {taxReturn.taxYear} {returnTypes.find(t => t.value === taxReturn.type)?.label}
                              </p>
                            </div>
                          </div>
                          <Badge variant={statusColors[taxReturn.status] || 'default'}>
                            {taxReturn.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-secondary-500">Due Date</p>
                            <p className="font-medium">
                              {taxReturn.dueDate ? formatDate(taxReturn.dueDate) : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-secondary-500">Documents</p>
                            <p className="font-medium">{progress.received}/{progress.total} ({progress.percentage}%)</p>
                          </div>
                          <div>
                            <p className="text-secondary-500">Estimate</p>
                            <p className={`font-medium ${taxReturn.estimatedRefund ? 'text-green-600' : taxReturn.estimatedOwed ? 'text-red-600' : ''}`}>
                              {taxReturn.estimatedRefund ? `Refund: ${formatCurrency(parseDecimal(taxReturn.estimatedRefund))}` :
                               taxReturn.estimatedOwed ? `Owed: ${formatCurrency(parseDecimal(taxReturn.estimatedOwed))}` : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              {deadlines.length === 0 ? (
                <p className="text-secondary-500 text-sm">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((deadline) => {
                    const daysUntil = Math.ceil((new Date(deadline.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={deadline.id} className="p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{deadline.name}</p>
                          {daysUntil <= 7 ? (
                            <Badge variant="danger" size="sm">{daysUntil}d</Badge>
                          ) : daysUntil <= 30 ? (
                            <Badge variant="warning" size="sm">{daysUntil}d</Badge>
                          ) : (
                            <Badge variant="default" size="sm">{daysUntil}d</Badge>
                          )}
                        </div>
                        <p className="text-xs text-secondary-500">{formatDate(deadline.dueDate)}</p>
                        {deadline.description && (
                          <p className="text-xs text-secondary-600 mt-1">{deadline.description}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="bordered" className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                <FileCheck className="h-4 w-4 mr-2" />
                File Extension
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View Tax Calendar
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Receipt className="h-4 w-4 mr-2" />
                Estimated Payments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tax Return Details Modal */}
      {selectedReturn && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Tax Return Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg mr-4">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{getClientName(selectedReturn.client)}</h3>
                  <p className="text-secondary-600">
                    {selectedReturn.taxYear} {returnTypes.find(t => t.value === selectedReturn.type)?.label}
                  </p>
                </div>
              </div>
              <Badge variant={statusColors[selectedReturn.status] || 'default'}>
                {selectedReturn.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Tax Year</p>
                <p className="font-medium">{selectedReturn.taxYear}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Return Type</p>
                <p className="font-medium">{returnTypes.find(t => t.value === selectedReturn.type)?.label}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Filing Status</p>
                <p className="font-medium">{selectedReturn.filingStatus || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Status</p>
                <p className="font-medium">{selectedReturn.status.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Due Date</p>
                <p className="font-medium">
                  {selectedReturn.dueDate ? formatDate(selectedReturn.dueDate) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Extended Due Date</p>
                <p className="font-medium">
                  {selectedReturn.extendedDueDate ? formatDate(selectedReturn.extendedDueDate) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Filed Date</p>
                <p className="font-medium">
                  {selectedReturn.filedDate ? formatDate(selectedReturn.filedDate) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Estimate</p>
                <p className={`font-medium ${selectedReturn.estimatedRefund ? 'text-green-600' : selectedReturn.estimatedOwed ? 'text-red-600' : ''}`}>
                  {selectedReturn.estimatedRefund ? `Refund: ${formatCurrency(parseDecimal(selectedReturn.estimatedRefund))}` :
                   selectedReturn.estimatedOwed ? `Owed: ${formatCurrency(parseDecimal(selectedReturn.estimatedOwed))}` : '-'}
                </p>
              </div>
            </div>

            {/* Checklist Progress */}
            <div>
              <h4 className="font-semibold mb-3">Document Checklist</h4>
              <div className="space-y-2">
                {selectedReturn.checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-secondary-50 rounded">
                    <div className="flex items-center">
                      {item.isReceived ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 text-secondary-400 mr-2" />
                      )}
                      <span className="text-sm">{item.name}</span>
                      {item.isRequired && (
                        <Badge variant="danger" size="sm" className="ml-2">Required</Badge>
                      )}
                    </div>
                    <span className="text-xs text-secondary-500">{item.category}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  Progress: {getChecklistProgress(selectedReturn.checklistItems).received} of {getChecklistProgress(selectedReturn.checklistItems).total} documents received
                  ({getChecklistProgress(selectedReturn.checklistItems).percentage}%)
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Tax Return Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Tax Return" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Client"
            options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            required
          />
          <Input
            label="Tax Year"
            type="number"
            value={formData.taxYear}
            onChange={(e) => setFormData({ ...formData, taxYear: parseInt(e.target.value) })}
            required
          />
          <Select
            label="Return Type"
            options={returnTypes}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Return</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
