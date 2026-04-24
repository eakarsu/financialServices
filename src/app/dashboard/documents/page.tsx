'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Filter, FileText, Folder, Download, Trash2,
  Upload, Send, CheckCircle, Clock, File, Image, FileSpreadsheet, Edit
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Textarea from '@/components/ui/Textarea'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import SortableHeader from '@/components/ui/SortableHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'

interface Document {
  id: string
  name: string
  description?: string
  type: string
  category?: string
  fileUrl: string
  fileSize: number
  mimeType: string
  version: number
  status: string
  taxYear?: number
  createdAt: string
  client?: { id: string; businessName?: string; firstName?: string; lastName?: string }
  uploadedBy: { firstName: string; lastName: string }
  folder?: { id: string; name: string }
}

interface Client {
  id: string
  businessName?: string
  firstName?: string
  lastName?: string
}

interface DocumentRequestTemplate {
  id: string
  name: string
  description?: string
  category: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const documentTypes = [
  { value: 'TAX_RETURN', label: 'Tax Return' },
  { value: 'FINANCIAL_STATEMENT', label: 'Financial Statement' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'ENGAGEMENT_LETTER', label: 'Engagement Letter' },
  { value: 'W2', label: 'W-2' },
  { value: 'W9', label: 'W-9' },
  { value: 'FORM_1099', label: '1099' },
  { value: 'K1', label: 'K-1' },
  { value: 'OTHER', label: 'Other' },
]

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const clientParam = searchParams.get('client')
  const { toast } = useToast()

  const [documents, setDocuments] = useState<Document[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [documentRequestTemplates, setDocumentRequestTemplates] = useState<DocumentRequestTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState(clientParam || 'all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Pagination and sort state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    documentId: string | null
  }>({ isOpen: false, documentId: null })
  const [deleting, setDeleting] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'OTHER',
    description: '',
    clientId: clientParam || '',
    taxYear: new Date().getFullYear(),
  })

  const [signatureForm, setSignatureForm] = useState({
    signerName: '',
    signerEmail: '',
  })

  useEffect(() => {
    fetchDocuments()
    fetchClients()
    fetchDocumentRequestTemplates()
  }, [typeFilter, statusFilter, clientFilter, page, limit, sortBy, sortOrder])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (clientFilter !== 'all') params.set('client', clientFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)

      const res = await fetch(`/api/documents?${params}`)
      if (!res.ok) throw new Error('Failed to fetch documents')
      const response = await res.json()
      setDocuments(response.data)
      setPagination(response.pagination)
    } catch (error) {
      toast('Failed to load documents. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      const data = await res.json()
      setClients(data)
    } catch (error) {
      toast('Failed to load clients.', 'error')
    }
  }

  const fetchDocumentRequestTemplates = async () => {
    try {
      const res = await fetch('/api/templates/document-requests')
      if (!res.ok) throw new Error('Failed to fetch templates')
      const data = await res.json()
      setDocumentRequestTemplates(data)
    } catch (error) {
      toast('Failed to load document request templates.', 'error')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // In production, you would upload the file to storage first
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...uploadForm,
          fileUrl: '/uploads/placeholder.pdf', // Placeholder
          fileSize: 1024,
          mimeType: 'application/pdf',
          status: 'DRAFT',
        }),
      })

      if (res.ok) {
        toast('Document uploaded successfully.', 'success')
        setShowUploadModal(false)
        setUploadForm({
          name: '',
          type: 'OTHER',
          description: '',
          clientId: '',
          taxYear: new Date().getFullYear(),
        })
        fetchDocuments()
      } else {
        toast('Failed to upload document. Please try again.', 'error')
      }
    } catch (error) {
      toast('Failed to upload document. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestSignature = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoc) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/signatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signatureForm),
      })

      if (res.ok) {
        toast('Signature request sent successfully.', 'success')
      } else {
        toast('Failed to send signature request.', 'error')
      }

      setShowSignatureModal(false)
      setSignatureForm({ signerName: '', signerEmail: '' })
      fetchDocuments()
    } catch (error) {
      toast('Failed to send signature request. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({ isOpen: true, documentId: id })
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDialog.documentId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/documents/${confirmDialog.documentId}`, { method: 'DELETE' })
      if (res.ok) {
        toast('Document deleted successfully.', 'success')
        // Close the detail modal if the deleted doc is currently open
        if (selectedDoc && selectedDoc.id === confirmDialog.documentId) {
          setShowDetailsModal(false)
          setSelectedDoc(null)
        }
        fetchDocuments()
      } else {
        toast('Failed to delete document. Please try again.', 'error')
      }
    } catch (error) {
      toast('Failed to delete document. Please try again.', 'error')
    } finally {
      setDeleting(false)
      setConfirmDialog({ isOpen: false, documentId: null })
    }
  }

  const handleDeleteCancel = () => {
    setConfirmDialog({ isOpen: false, documentId: null })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchDocuments()
  }

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <Image className="h-5 w-5" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      DRAFT: 'default',
      PENDING_REVIEW: 'warning',
      APPROVED: 'success',
      SIGNED: 'success',
      ARCHIVED: 'danger',
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getClientName = (client?: Client) => {
    if (!client) return '-'
    return client.businessName || `${client.firstName} ${client.lastName}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Documents</h1>
          <p className="text-secondary-600">Manage client documents and files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowRequestModal(true)}>
            <Send className="h-4 w-4 mr-2" />
            Request Documents
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
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
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <Select
              options={[{ value: 'all', label: 'All Clients' }, ...clients.map(c => ({
                value: c.id,
                label: getClientName(c),
              }))]}
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-48"
            />
            <Select
              options={[{ value: 'all', label: 'All Types' }, ...documentTypes]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING_REVIEW', label: 'Pending Review' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'SIGNED', label: 'Signed' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Button type="submit" variant="secondary">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card variant="bordered">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={limit > 10 ? 10 : limit} cols={7} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader
                    label="Document"
                    sortKey="name"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead>Client</TableHead>
                  <SortableHeader
                    label="Type"
                    sortKey="type"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead>Size</TableHead>
                  <SortableHeader
                    label="Uploaded"
                    sortKey="createdAt"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-secondary-500">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc)
                        setShowDetailsModal(true)
                      }}
                      className="cursor-pointer hover:bg-secondary-50"
                    >
                      <TableCell>
                        <div className="flex items-center">
                          <div className="p-2 bg-secondary-100 rounded-lg mr-3">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900">{doc.name}</p>
                            {doc.description && (
                              <p className="text-xs text-secondary-500 truncate max-w-[200px]">{doc.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getClientName(doc.client)}</TableCell>
                      <TableCell><Badge variant="outline">{doc.type.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDate(doc.createdAt)}</p>
                          <p className="text-xs text-secondary-500">{doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</p>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="p-1" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            title="Request Signature"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDoc(doc)
                              setShowSignatureModal(true)
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(doc.id)
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
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="border-t border-secondary-200 px-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
        )}
      </Card>

      {/* Confirm Dialog for Delete */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Document" size="md">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
            <p className="text-secondary-600 mb-2">Drag and drop files here, or click to browse</p>
            <p className="text-xs text-secondary-400">PDF, DOC, XLS, JPG, PNG up to 10MB</p>
            <input type="file" className="hidden" />
            <Button type="button" variant="secondary" size="sm" className="mt-4">
              Browse Files
            </Button>
          </div>

          <Input
            label="Document Name"
            value={uploadForm.name}
            onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
            required
          />

          <Select
            label="Document Type"
            options={documentTypes}
            value={uploadForm.type}
            onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
          />

          <Select
            label="Client"
            options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
            value={uploadForm.clientId}
            onChange={(e) => setUploadForm({ ...uploadForm, clientId: e.target.value })}
          />

          <Input
            label="Tax Year"
            type="number"
            value={uploadForm.taxYear}
            onChange={(e) => setUploadForm({ ...uploadForm, taxYear: parseInt(e.target.value) })}
          />

          <Textarea
            label="Description"
            value={uploadForm.description}
            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Upload Document</Button>
          </div>
        </form>
      </Modal>

      {/* Request Documents Modal */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Request Documents" size="md">
        <div className="space-y-4">
          <Select
            label="Client"
            options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">Documents to Request</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {documentRequestTemplates.length === 0 ? (
                <p className="text-sm text-secondary-500">No document templates available</p>
              ) : (
                documentRequestTemplates.map((template) => (
                  <label key={template.id} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{template.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <Input label="Due Date" type="date" />

          <Textarea label="Additional Instructions" rows={3} placeholder="Any specific instructions for the client..." />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button>Send Request</Button>
          </div>
        </div>
      </Modal>

      {/* Request Signature Modal */}
      <Modal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)} title="Request E-Signature" size="md">
        <form onSubmit={handleRequestSignature} className="space-y-4">
          <p className="text-sm text-secondary-600">
            Request an electronic signature for: <strong>{selectedDoc?.name}</strong>
          </p>

          <Input
            label="Signer Name"
            value={signatureForm.signerName}
            onChange={(e) => setSignatureForm({ ...signatureForm, signerName: e.target.value })}
            required
          />

          <Input
            label="Signer Email"
            type="email"
            value={signatureForm.signerEmail}
            onChange={(e) => setSignatureForm({ ...signatureForm, signerEmail: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowSignatureModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Send Signature Request</Button>
          </div>
        </form>
      </Modal>

      {/* Document Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedDoc(null)
        }}
        title="Document Details"
        size="lg"
      >
        {selectedDoc && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-secondary-200">
              <div className="flex items-center">
                <div className="p-3 bg-secondary-100 rounded-lg mr-4">
                  {getFileIcon(selectedDoc.mimeType)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-900">{selectedDoc.name}</h3>
                  <p className="text-sm text-secondary-500">v{selectedDoc.version}</p>
                </div>
              </div>
              {getStatusBadge(selectedDoc.status)}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Client</h4>
                <p className="text-secondary-900">{getClientName(selectedDoc.client)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Document Type</h4>
                <p className="text-secondary-900">{selectedDoc.type.replace('_', ' ')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">File Size</h4>
                <p className="text-secondary-900">{formatFileSize(selectedDoc.fileSize)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">File Type</h4>
                <p className="text-secondary-900">{selectedDoc.mimeType}</p>
              </div>
              {selectedDoc.taxYear && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-500 mb-1">Tax Year</h4>
                  <p className="text-secondary-900">{selectedDoc.taxYear}</p>
                </div>
              )}
              {selectedDoc.category && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-500 mb-1">Category</h4>
                  <p className="text-secondary-900">{selectedDoc.category}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Uploaded By</h4>
                <p className="text-secondary-900">{selectedDoc.uploadedBy.firstName} {selectedDoc.uploadedBy.lastName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Uploaded At</h4>
                <p className="text-secondary-900">{formatDate(selectedDoc.createdAt)}</p>
              </div>
              {selectedDoc.description && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-secondary-500 mb-1">Description</h4>
                  <p className="text-secondary-900">{selectedDoc.description}</p>
                </div>
              )}
              {selectedDoc.folder && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-500 mb-1">Folder</h4>
                  <p className="text-secondary-900">{selectedDoc.folder.name}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t border-secondary-200">
              <Button
                variant="danger"
                onClick={() => {
                  handleDeleteClick(selectedDoc.id)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedDoc(null)
                  }}
                >
                  Close
                </Button>
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="secondary">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowSignatureModal(true)
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Request Signature
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
