'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Building, User, MoreVertical, Edit, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ExportButton from '@/components/ExportButton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate } from '@/lib/utils'

interface Client {
  id: string
  clientNumber: string
  type: string
  status: string
  firstName?: string
  lastName?: string
  businessName?: string
  email?: string
  phone?: string
  city?: string
  state?: string
  createdAt: string
  _count: {
    documents: number
    engagements: number
    transactions: number
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    type: 'INDIVIDUAL',
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    entityType: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [statusFilter, typeFilter])

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchClients()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowModal(false)
        setFormData({
          type: 'INDIVIDUAL',
          firstName: '',
          lastName: '',
          businessName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          entityType: '',
        })
        fetchClients()
      }
    } catch (error) {
      console.error('Error creating client:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      ACTIVE: 'success',
      PROSPECT: 'info' as 'default',
      INACTIVE: 'warning',
      ARCHIVED: 'danger',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getClientName = (client: Client) => {
    if (client.type === 'BUSINESS') {
      return client.businessName || 'Unnamed Business'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unnamed Client'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Clients</h1>
          <p className="text-secondary-600">Manage your client portfolio</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            endpoint="/api/reports/export/clients"
            label="Export"
            filters={{ status: statusFilter !== 'all' ? statusFilter : undefined }}
            variant="button"
          />
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card variant="bordered">
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'PROSPECT', label: 'Prospect' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'INDIVIDUAL', label: 'Individual' },
                { value: 'BUSINESS', label: 'Business' },
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40"
            />
            <Button type="submit" variant="secondary">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card variant="bordered">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-secondary-500">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client)
                      setShowDetailsModal(true)
                    }}
                    className="cursor-pointer hover:bg-secondary-50"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${client.type === 'BUSINESS' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {client.type === 'BUSINESS' ? (
                            <Building className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{getClientName(client)}</p>
                          <p className="text-xs text-secondary-500">{client.clientNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{client.email || '-'}</p>
                        <p className="text-xs text-secondary-500">{client.phone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.city && client.state ? `${client.city}, ${client.state}` : '-'}
                    </TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/clients/${client.id}/edit`}>
                          <Button variant="ghost" size="sm" className="p-1">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(client.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Client Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Client" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Client Type"
            options={[
              { value: 'INDIVIDUAL', label: 'Individual' },
              { value: 'BUSINESS', label: 'Business' },
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          {formData.type === 'INDIVIDUAL' ? (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          ) : (
            <>
              <Input
                label="Business Name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
              <Select
                label="Entity Type"
                options={[
                  { value: '', label: 'Select entity type' },
                  { value: 'SOLE_PROPRIETOR', label: 'Sole Proprietor' },
                  { value: 'PARTNERSHIP', label: 'Partnership' },
                  { value: 'LLC', label: 'LLC' },
                  { value: 'S_CORP', label: 'S Corporation' },
                  { value: 'C_CORP', label: 'C Corporation' },
                  { value: 'NON_PROFIT', label: 'Non-Profit' },
                ]}
                value={formData.entityType}
                onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="Zip Code"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Client Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedClient(null)
        }}
        title="Client Details"
        size="lg"
      >
        {selectedClient && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-secondary-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg mr-4 ${selectedClient.type === 'BUSINESS' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {selectedClient.type === 'BUSINESS' ? (
                    <Building className="h-6 w-6 text-blue-600" />
                  ) : (
                    <User className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-900">{getClientName(selectedClient)}</h3>
                  <p className="text-sm text-secondary-500">{selectedClient.clientNumber}</p>
                </div>
              </div>
              {getStatusBadge(selectedClient.status)}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Type</h4>
                <p className="text-secondary-900">{selectedClient.type}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Status</h4>
                <p className="text-secondary-900">{selectedClient.status}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Email</h4>
                <p className="text-secondary-900">{selectedClient.email || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Phone</h4>
                <p className="text-secondary-900">{selectedClient.phone || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Address</h4>
                <p className="text-secondary-900">
                  {selectedClient.city && selectedClient.state
                    ? `${selectedClient.city}, ${selectedClient.state}`
                    : '-'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Created</h4>
                <p className="text-secondary-900">{formatDate(selectedClient.createdAt)}</p>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-secondary-200">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{selectedClient._count.documents}</p>
                <p className="text-sm text-secondary-600">Documents</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{selectedClient._count.engagements}</p>
                <p className="text-sm text-secondary-600">Engagements</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{selectedClient._count.transactions}</p>
                <p className="text-sm text-secondary-600">Transactions</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedClient(null)
                }}
              >
                Close
              </Button>
              <Link href={`/dashboard/clients/${selectedClient.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
