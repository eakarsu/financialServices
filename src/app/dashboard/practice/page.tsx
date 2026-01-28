'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Clock, DollarSign, FileText, CheckSquare, Users, Calendar,
  Play, Pause, Send, Download
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate, formatCurrency, parseDecimal } from '@/lib/utils'

interface TimeEntry {
  id: string
  date: string
  hours: string
  description: string
  isBillable: boolean
  rate?: string
  amount?: string
  status: string
  user: { firstName: string; lastName: string }
  engagement?: { name: string; client: { businessName?: string; firstName?: string; lastName?: string } }
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: string
  total: string
  paidAmount: string
  client: { businessName?: string; firstName?: string; lastName?: string }
}

interface Task {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  dueDate?: string
  client?: { businessName?: string; firstName?: string; lastName?: string }
  assignedTo?: { firstName: string; lastName: string }
}

interface Client {
  id: string
  businessName?: string
  firstName?: string
  lastName?: string
}

interface Engagement {
  id: string
  name: string
  client: Client
}

interface FirmSettings {
  defaultHourlyRate: number
  defaultPaymentTerms: number
  invoicePrefix: string
}

interface ServiceItem {
  id: string
  name: string
  description?: string
  defaultRate: number
  category?: string
}

export default function PracticePage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [settings, setSettings] = useState<FirmSettings | null>(null)
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [showTimeDetailsModal, setShowTimeDetailsModal] = useState(false)
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false)
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false)
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntry | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const [timeForm, setTimeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    isBillable: true,
    rate: '',
    engagementId: '',
  })

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: '0',
    notes: '',
    lineItems: [{ serviceItemId: '', description: '', quantity: 1, rate: 0 }],
  })

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    clientId: '',
    assignedToId: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [timeRes, invoiceRes, taskRes, clientRes, settingsRes, serviceItemsRes] = await Promise.all([
        fetch('/api/practice/time-entries'),
        fetch('/api/practice/invoices'),
        fetch('/api/practice/tasks'),
        fetch('/api/clients'),
        fetch('/api/settings'),
        fetch('/api/service-items'),
      ])

      setTimeEntries(await timeRes.json())
      setInvoices(await invoiceRes.json())
      setTasks(await taskRes.json())
      setClients(await clientRes.json())

      const serviceItemsData = await serviceItemsRes.json()
      console.log('Service Items fetched:', serviceItemsData)
      console.log('Service Items response status:', serviceItemsRes.status)
      // Ensure it's an array, if error object is returned, use empty array
      setServiceItems(Array.isArray(serviceItemsData) ? serviceItemsData : [])

      const settingsData = await settingsRes.json()
      setSettings(settingsData)

      // Set default rate from settings
      if (settingsData?.defaultHourlyRate) {
        setTimeForm(prev => ({ ...prev, rate: settingsData.defaultHourlyRate.toString() }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTime = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/practice/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...timeForm,
          hours: parseFloat(timeForm.hours),
          rate: timeForm.isBillable ? parseFloat(timeForm.rate) : null,
        }),
      })
      setShowTimeModal(false)
      setTimeForm({
        date: new Date().toISOString().split('T')[0],
        hours: '',
        description: '',
        isBillable: true,
        rate: settings?.defaultHourlyRate?.toString() || '150',
        engagementId: '',
      })
      fetchData()
    } catch (error) {
      console.error('Error adding time entry:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/practice/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoiceForm,
          taxRate: parseFloat(invoiceForm.taxRate),
        }),
      })
      setShowInvoiceModal(false)
      setInvoiceForm({
        clientId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        taxRate: '0',
        notes: '',
        lineItems: [{ serviceItemId: '', description: '', quantity: 1, rate: 0 }],
      })
      fetchData()
    } catch (error) {
      console.error('Error creating invoice:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/practice/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm),
      })
      setShowTaskModal(false)
      setTaskForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        clientId: '',
        assignedToId: '',
      })
      fetchData()
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getClientName = (client?: { businessName?: string; firstName?: string; lastName?: string }) => {
    if (!client) return '-'
    return client.businessName || `${client.firstName} ${client.lastName}`
  }

  const totalHours = timeEntries.reduce((sum, e) => sum + parseDecimal(e.hours), 0)
  const billableHours = timeEntries.filter(e => e.isBillable).reduce((sum, e) => sum + parseDecimal(e.hours), 0)
  const totalBilled = invoices.reduce((sum, inv) => sum + parseDecimal(inv.total), 0)
  const totalCollected = invoices.reduce((sum, inv) => sum + parseDecimal(inv.paidAmount), 0)

  return (
    <div className="space-y-6">
      {/* Debug Panel */}
      <Card variant="bordered" className="bg-blue-50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-secondary-600">Time Entries:</p>
              <p className="font-bold">{timeEntries.length} records</p>
            </div>
            <div>
              <p className="text-secondary-600">Invoices:</p>
              <p className="font-bold">{invoices.length} records</p>
            </div>
            <div>
              <p className="text-secondary-600">Tasks:</p>
              <p className="font-bold">{tasks.length} records</p>
            </div>
            <div>
              <p className="text-secondary-600">Service Items:</p>
              <p className="font-bold">{serviceItems.length} records</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Practice Management</h1>
          <p className="text-secondary-600">Track time, billing, and tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowTaskModal(true)}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          <Button variant="secondary" onClick={() => setShowInvoiceModal(true)}>
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
          <Button onClick={() => setShowTimeModal(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Log Time
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Hours</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Billable Hours</p>
              <p className="text-2xl font-bold">{billableHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Billed</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBilled)}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <CheckSquare className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Collected</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card variant="bordered">
        <Tabs defaultValue="time">
          <TabsList className="px-4 pt-4">
            <TabsTrigger value="time">Time Entries</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : timeEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-secondary-500">
                      No time entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  timeEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      onClick={() => {
                        setSelectedTimeEntry(entry)
                        setShowTimeDetailsModal(true)
                      }}
                      className="cursor-pointer hover:bg-secondary-50"
                    >
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          {entry.engagement && (
                            <p className="text-xs text-secondary-500">{getClientName(entry.engagement.client)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{entry.user.firstName} {entry.user.lastName}</TableCell>
                      <TableCell>{parseDecimal(entry.hours).toFixed(1)}</TableCell>
                      <TableCell>
                        {entry.isBillable ? formatCurrency(parseDecimal(entry.rate || '0')) : '-'}
                      </TableCell>
                      <TableCell>
                        {entry.amount ? formatCurrency(parseDecimal(entry.amount)) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.isBillable ? 'success' : 'default'}>
                          {entry.isBillable ? 'Billable' : 'Non-billable'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="invoices" className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-secondary-500">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvoice(inv)
                        setShowInvoiceDetailsModal(true)
                      }}
                      className="cursor-pointer hover:bg-secondary-50"
                    >
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{getClientName(inv.client)}</TableCell>
                      <TableCell>{formatDate(inv.issueDate)}</TableCell>
                      <TableCell>{formatDate(inv.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(parseDecimal(inv.total))}</TableCell>
                      <TableCell>{formatCurrency(parseDecimal(inv.paidAmount))}</TableCell>
                      <TableCell>
                        <Badge variant={
                          inv.status === 'PAID' ? 'success' :
                          inv.status === 'OVERDUE' ? 'danger' :
                          inv.status === 'SENT' ? 'info' : 'default'
                        }>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="p-1" title="Send">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="tasks" className="p-4">
            <div className="space-y-3">
              {loading ? (
                <p className="text-center py-8">Loading...</p>
              ) : tasks.length === 0 ? (
                <p className="text-center py-8 text-secondary-500">No tasks found</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100"
                    onClick={() => {
                      setSelectedTask(task)
                      setShowTaskDetailsModal(true)
                    }}
                  >
                    <div className="flex items-center">
                      <input type="checkbox" className="rounded mr-3" onClick={(e) => e.stopPropagation()} />
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-secondary-500">
                          {task.client && getClientName(task.client)}
                          {task.dueDate && ` • Due: ${formatDate(task.dueDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        task.priority === 'URGENT' ? 'danger' :
                        task.priority === 'HIGH' ? 'warning' : 'default'
                      } size="sm">
                        {task.priority}
                      </Badge>
                      <Badge variant={
                        task.status === 'COMPLETED' ? 'success' :
                        task.status === 'IN_PROGRESS' ? 'info' : 'default'
                      } size="sm">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Time Entry Details Modal */}
      {selectedTimeEntry && (
        <Modal
          isOpen={showTimeDetailsModal}
          onClose={() => setShowTimeDetailsModal(false)}
          title="Time Entry Details"
          size="md"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Date</p>
                <p className="font-medium">{formatDate(selectedTimeEntry.date)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Hours</p>
                <p className="font-medium">{parseDecimal(selectedTimeEntry.hours).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Staff Member</p>
                <p className="font-medium">
                  {selectedTimeEntry.user.firstName} {selectedTimeEntry.user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Billable</p>
                <Badge variant={selectedTimeEntry.isBillable ? 'success' : 'default'}>
                  {selectedTimeEntry.isBillable ? 'Yes' : 'No'}
                </Badge>
              </div>
              {selectedTimeEntry.isBillable && (
                <>
                  <div>
                    <p className="text-sm text-secondary-500">Rate</p>
                    <p className="font-medium">
                      {formatCurrency(parseDecimal(selectedTimeEntry.rate || '0'))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Amount</p>
                    <p className="font-medium">
                      {selectedTimeEntry.amount ? formatCurrency(parseDecimal(selectedTimeEntry.amount)) : '-'}
                    </p>
                  </div>
                </>
              )}
              {selectedTimeEntry.engagement && (
                <>
                  <div>
                    <p className="text-sm text-secondary-500">Engagement</p>
                    <p className="font-medium">{selectedTimeEntry.engagement.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Client</p>
                    <p className="font-medium">{getClientName(selectedTimeEntry.engagement.client)}</p>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <p className="text-sm text-secondary-500">Description</p>
                <p className="font-medium">{selectedTimeEntry.description}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button variant="secondary" onClick={() => setShowTimeDetailsModal(false)}>Close</Button>
              <Button>Edit Entry</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={showInvoiceDetailsModal}
          onClose={() => setShowInvoiceDetailsModal(false)}
          title="Invoice Details"
          size="md"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedInvoice.invoiceNumber}</h3>
                <p className="text-secondary-600">{getClientName(selectedInvoice.client)}</p>
              </div>
              <Badge variant={
                selectedInvoice.status === 'PAID' ? 'success' :
                selectedInvoice.status === 'OVERDUE' ? 'danger' :
                selectedInvoice.status === 'SENT' ? 'info' : 'default'
              }>
                {selectedInvoice.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Issue Date</p>
                <p className="font-medium">{formatDate(selectedInvoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Due Date</p>
                <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Total Amount</p>
                <p className="font-medium text-lg">{formatCurrency(parseDecimal(selectedInvoice.total))}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Paid Amount</p>
                <p className="font-medium text-lg">{formatCurrency(parseDecimal(selectedInvoice.paidAmount))}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Balance Due</p>
                <p className="font-medium text-lg text-red-600">
                  {formatCurrency(parseDecimal(selectedInvoice.total) - parseDecimal(selectedInvoice.paidAmount))}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button variant="secondary" onClick={() => setShowInvoiceDetailsModal(false)}>Close</Button>
              <Button variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={showTaskDetailsModal}
          onClose={() => setShowTaskDetailsModal(false)}
          title="Task Details"
          size="md"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-secondary-600 mt-2">{selectedTask.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Priority</p>
                <Badge variant={
                  selectedTask.priority === 'URGENT' ? 'danger' :
                  selectedTask.priority === 'HIGH' ? 'warning' : 'default'
                }>
                  {selectedTask.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Status</p>
                <Badge variant={
                  selectedTask.status === 'COMPLETED' ? 'success' :
                  selectedTask.status === 'IN_PROGRESS' ? 'info' : 'default'
                }>
                  {selectedTask.status.replace('_', ' ')}
                </Badge>
              </div>
              {selectedTask.dueDate && (
                <div>
                  <p className="text-sm text-secondary-500">Due Date</p>
                  <p className="font-medium">{formatDate(selectedTask.dueDate)}</p>
                </div>
              )}
              {selectedTask.client && (
                <div>
                  <p className="text-sm text-secondary-500">Client</p>
                  <p className="font-medium">{getClientName(selectedTask.client)}</p>
                </div>
              )}
              {selectedTask.assignedTo && (
                <div>
                  <p className="text-sm text-secondary-500">Assigned To</p>
                  <p className="font-medium">
                    {selectedTask.assignedTo.firstName} {selectedTask.assignedTo.lastName}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button variant="secondary" onClick={() => setShowTaskDetailsModal(false)}>Close</Button>
              <Button>Edit Task</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Time Entry Modal */}
      <Modal isOpen={showTimeModal} onClose={() => setShowTimeModal(false)} title="Log Time" size="md">
        <form onSubmit={handleAddTime} className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={timeForm.date}
            onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
            required
          />
          <Input
            label="Hours"
            type="number"
            step="0.25"
            value={timeForm.hours}
            onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={timeForm.description}
            onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
            required
            rows={3}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={timeForm.isBillable}
                onChange={(e) => setTimeForm({ ...timeForm, isBillable: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Billable</span>
            </label>
            {timeForm.isBillable && (
              <Input
                label="Rate"
                type="number"
                value={timeForm.rate}
                onChange={(e) => setTimeForm({ ...timeForm, rate: e.target.value })}
                className="w-32"
              />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowTimeModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Log Time</Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Create Invoice" size="lg">
        <form onSubmit={handleAddInvoice} className="space-y-4">
          <Select
            label="Client"
            options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
            value={invoiceForm.clientId}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={invoiceForm.issueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Line Items</label>
            {invoiceForm.lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                <Select
                  placeholder="Select service"
                  options={[
                    { value: '', label: 'Select service...' },
                    ...serviceItems.map(si => ({
                      value: si.id,
                      label: `${si.name} - $${si.defaultRate}`,
                    }))
                  ]}
                  value={item.serviceItemId}
                  onChange={(e) => {
                    const items = [...invoiceForm.lineItems]
                    const selectedService = serviceItems.find(si => si.id === e.target.value)
                    if (selectedService) {
                      items[index] = {
                        serviceItemId: selectedService.id,
                        description: selectedService.name,
                        quantity: 1,
                        rate: selectedService.defaultRate
                      }
                    } else {
                      items[index] = { serviceItemId: '', description: '', quantity: 1, rate: 0 }
                    }
                    setInvoiceForm({ ...invoiceForm, lineItems: items })
                  }}
                  className="col-span-2"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => {
                    const items = [...invoiceForm.lineItems]
                    items[index].quantity = parseFloat(e.target.value) || 0
                    setInvoiceForm({ ...invoiceForm, lineItems: items })
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setInvoiceForm({
                ...invoiceForm,
                lineItems: [...invoiceForm.lineItems, { serviceItemId: '', description: '', quantity: 1, rate: 0 }],
              })}
            >
              + Add Line Item
            </Button>
          </div>
          <Textarea
            label="Notes"
            value={invoiceForm.notes}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
            rows={2}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create Task" size="md">
        <form onSubmit={handleAddTask} className="space-y-4">
          <Input
            label="Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>
          <Select
            label="Client"
            options={[{ value: '', label: 'Select client (optional)' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
            value={taskForm.clientId}
            onChange={(e) => setTaskForm({ ...taskForm, clientId: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowTaskModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
