'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit, Building, User, Mail, Phone, MapPin, FileText, Clock,
  DollarSign, Users, Plus, Calendar, MessageSquare, Briefcase, CreditCard
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate, formatCurrency, parseDecimal } from '@/lib/utils'

interface Client {
  id: string
  clientNumber: string
  type: string
  status: string
  firstName?: string
  lastName?: string
  businessName?: string
  entityType?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  portalEnabled: boolean
  createdAt: string
  contacts: Array<{
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    isPrimary: boolean
    title?: string
  }>
  engagements: Array<{
    id: string
    name: string
    type: string
    status: string
    startDate: string
    endDate?: string
    budgetAmount?: string
  }>
  documents: Array<{
    id: string
    name: string
    type: string
    status: string
    createdAt: string
  }>
  notes: Array<{
    id: string
    content: string
    isPinned: boolean
    createdAt: string
    createdBy: { firstName: string; lastName: string }
  }>
  bankAccounts: Array<{
    id: string
    name: string
    accountType: string
    balance: string
    isActive: boolean
  }>
  taxReturns: Array<{
    id: string
    taxYear: number
    type: string
    status: string
    dueDate?: string
  }>
  assignments: Array<{
    id: string
    role?: string
    user: { firstName: string; lastName: string; email: string }
  }>
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showEngagementModal, setShowEngagementModal] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    isPrimary: false,
  })
  const [engagementForm, setEngagementForm] = useState({
    name: '',
    type: 'TAX_PREPARATION',
    startDate: '',
    description: '',
    budgetAmount: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchClient()
  }, [resolvedParams.id])

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data)
      } else {
        router.push('/dashboard/clients')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch(`/api/clients/${resolvedParams.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      })
      setShowNoteModal(false)
      setNoteContent('')
      fetchClient()
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch(`/api/clients/${resolvedParams.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      setShowContactModal(false)
      setContactForm({ firstName: '', lastName: '', email: '', phone: '', title: '', isPrimary: false })
      fetchClient()
    } catch (error) {
      console.error('Error adding contact:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddEngagement = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch(`/api/clients/${resolvedParams.id}/engagements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(engagementForm),
      })
      setShowEngagementModal(false)
      setEngagementForm({ name: '', type: 'TAX_PREPARATION', startDate: '', description: '', budgetAmount: '' })
      fetchClient()
    } catch (error) {
      console.error('Error adding engagement:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!client) {
    return <div>Client not found</div>
  }

  const clientName = client.type === 'BUSINESS'
    ? client.businessName
    : `${client.firstName} ${client.lastName}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${client.type === 'BUSINESS' ? 'bg-blue-100' : 'bg-green-100'}`}>
              {client.type === 'BUSINESS' ? (
                <Building className="h-6 w-6 text-blue-600" />
              ) : (
                <User className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">{clientName}</h1>
              <p className="text-secondary-600">{client.clientNumber} • {client.type}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={client.status === 'ACTIVE' ? 'success' : 'warning'}>{client.status}</Badge>
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="secondary">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{client.documents.length}</p>
              <p className="text-sm text-secondary-500">Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <Briefcase className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{client.engagements.length}</p>
              <p className="text-sm text-secondary-500">Engagements</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <CreditCard className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{client.bankAccounts.length}</p>
              <p className="text-sm text-secondary-500">Bank Accounts</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <Calendar className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{client.taxReturns.length}</p>
              <p className="text-sm text-secondary-500">Tax Returns</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="space-y-6">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-secondary-400 mr-2" />
                  <a href={`mailto:${client.email}`} className="text-primary-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-secondary-400 mr-2" />
                  {client.phone}
                </div>
              )}
              {(client.address || client.city) && (
                <div className="flex items-start text-sm">
                  <MapPin className="h-4 w-4 text-secondary-400 mr-2 mt-0.5" />
                  <div>
                    {client.address && <p>{client.address}</p>}
                    {client.city && <p>{client.city}, {client.state} {client.zipCode}</p>}
                  </div>
                </div>
              )}
              {client.type === 'BUSINESS' && client.entityType && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-secondary-500">Entity Type</p>
                  <p className="text-sm font-medium">{client.entityType.replace('_', ' ')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contacts</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowContactModal(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {client.contacts.length === 0 ? (
                <p className="text-sm text-secondary-500">No contacts added</p>
              ) : (
                <div className="space-y-3">
                  {client.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start justify-between p-2 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {contact.firstName} {contact.lastName}
                          {contact.isPrimary && <Badge variant="info" size="sm" className="ml-2">Primary</Badge>}
                        </p>
                        {contact.title && <p className="text-xs text-secondary-500">{contact.title}</p>}
                        {contact.email && <p className="text-xs text-secondary-500">{contact.email}</p>}
                        {contact.phone && <p className="text-xs text-secondary-500">{contact.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Assignments */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Team Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {client.assignments.length === 0 ? (
                <p className="text-sm text-secondary-500">No team members assigned</p>
              ) : (
                <div className="space-y-2">
                  {client.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                          <Users className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{assignment.user.firstName} {assignment.user.lastName}</p>
                          {assignment.role && <p className="text-xs text-secondary-500">{assignment.role}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Card variant="bordered">
            <Tabs defaultValue="engagements">
              <TabsList className="px-4 pt-4">
                <TabsTrigger value="engagements">Engagements</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="tax">Tax Returns</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="engagements" className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Active Engagements</h3>
                  <Button size="sm" onClick={() => setShowEngagementModal(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                {client.engagements.length === 0 ? (
                  <p className="text-secondary-500 text-sm">No engagements</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Budget</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.engagements.map((eng) => (
                        <TableRow key={eng.id}>
                          <TableCell className="font-medium">{eng.name}</TableCell>
                          <TableCell><Badge variant="outline">{eng.type.replace('_', ' ')}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={eng.status === 'ACTIVE' ? 'success' : 'default'}>{eng.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(eng.startDate)}</TableCell>
                          <TableCell>{eng.budgetAmount ? formatCurrency(parseDecimal(eng.budgetAmount)) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="documents" className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Recent Documents</h3>
                  <Link href={`/dashboard/documents?client=${client.id}`}>
                    <Button size="sm" variant="secondary">View All</Button>
                  </Link>
                </div>
                {client.documents.length === 0 ? (
                  <p className="text-secondary-500 text-sm">No documents</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.name}</TableCell>
                          <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={doc.status === 'APPROVED' ? 'success' : 'default'}>{doc.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="tax" className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Tax Returns</h3>
                  <Link href={`/dashboard/tax?client=${client.id}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" /> New Return
                    </Button>
                  </Link>
                </div>
                {client.taxReturns.length === 0 ? (
                  <p className="text-secondary-500 text-sm">No tax returns</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.taxReturns.map((tr) => (
                        <TableRow key={tr.id}>
                          <TableCell className="font-medium">{tr.taxYear}</TableCell>
                          <TableCell><Badge variant="outline">{tr.type}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={tr.status === 'FILED' ? 'success' : tr.status === 'IN_PROGRESS' ? 'info' : 'default'}>
                              {tr.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{tr.dueDate ? formatDate(tr.dueDate) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="banking" className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Bank Accounts</h3>
                  <Link href={`/dashboard/bookkeeping?client=${client.id}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Connect
                    </Button>
                  </Link>
                </div>
                {client.bankAccounts.length === 0 ? (
                  <p className="text-secondary-500 text-sm">No bank accounts connected</p>
                ) : (
                  <div className="space-y-3">
                    {client.bankAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 text-secondary-400 mr-3" />
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-xs text-secondary-500">{account.accountType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(parseDecimal(account.balance))}</p>
                          <Badge variant={account.isActive ? 'success' : 'default'} size="sm">
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Client Notes</h3>
                  <Button size="sm" onClick={() => setShowNoteModal(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Note
                  </Button>
                </div>
                {client.notes.length === 0 ? (
                  <p className="text-secondary-500 text-sm">No notes</p>
                ) : (
                  <div className="space-y-3">
                    {client.notes.map((note) => (
                      <div key={note.id} className="p-3 bg-secondary-50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-secondary-500">
                          <span>{note.createdBy.firstName} {note.createdBy.lastName}</span>
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note">
        <form onSubmit={handleAddNote} className="space-y-4">
          <Textarea
            label="Note"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={4}
            required
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowNoteModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Note</Button>
          </div>
        </form>
      </Modal>

      {/* Add Contact Modal */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="Add Contact">
        <form onSubmit={handleAddContact} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={contactForm.firstName}
              onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={contactForm.lastName}
              onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Title"
            value={contactForm.title}
            onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={contactForm.isPrimary}
              onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Primary Contact</span>
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowContactModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Contact</Button>
          </div>
        </form>
      </Modal>

      {/* Add Engagement Modal */}
      <Modal isOpen={showEngagementModal} onClose={() => setShowEngagementModal(false)} title="Add Engagement">
        <form onSubmit={handleAddEngagement} className="space-y-4">
          <Input
            label="Engagement Name"
            value={engagementForm.name}
            onChange={(e) => setEngagementForm({ ...engagementForm, name: e.target.value })}
            required
          />
          <Select
            label="Type"
            options={[
              { value: 'TAX_PREPARATION', label: 'Tax Preparation' },
              { value: 'BOOKKEEPING', label: 'Bookkeeping' },
              { value: 'PAYROLL', label: 'Payroll' },
              { value: 'AUDIT', label: 'Audit' },
              { value: 'CONSULTING', label: 'Consulting' },
              { value: 'FINANCIAL_PLANNING', label: 'Financial Planning' },
              { value: 'OTHER', label: 'Other' },
            ]}
            value={engagementForm.type}
            onChange={(e) => setEngagementForm({ ...engagementForm, type: e.target.value })}
          />
          <Input
            label="Start Date"
            type="date"
            value={engagementForm.startDate}
            onChange={(e) => setEngagementForm({ ...engagementForm, startDate: e.target.value })}
            required
          />
          <Input
            label="Budget Amount"
            type="number"
            value={engagementForm.budgetAmount}
            onChange={(e) => setEngagementForm({ ...engagementForm, budgetAmount: e.target.value })}
            placeholder="0.00"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowEngagementModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Engagement</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
