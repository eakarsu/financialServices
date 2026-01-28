'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Users, DollarSign, Calendar, FileText, Play, CheckCircle, Clock,
  Download, CreditCard
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

interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email?: string
  status: string
  payType: string
  payRate: string
  payFrequency: string
  hireDate: string
  directDepositEnabled: boolean
  client: { id: string; businessName?: string; firstName?: string; lastName?: string }
}

interface PayrollRun {
  id: string
  payPeriodStart: string
  payPeriodEnd: string
  payDate: string
  status: string
  totalGross: string
  totalNet: string
  totalTaxes: string
  employeeCount: number
  client: { id: string; businessName?: string; firstName?: string; lastName?: string }
  items: Array<{
    id: string
    employee: { firstName: string; lastName: string }
    grossPay: string
    netPay: string
  }>
}

interface Client {
  id: string
  businessName?: string
  firstName?: string
  lastName?: string
}

interface ReportTemplate {
  id: string
  name: string
  description?: string
  category: string
}

export default function PayrollPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [clientFilter, setClientFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('employees')
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'all' | 'ACTIVE'>('all')
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false)
  const [showPayrollDetailsModal, setShowPayrollDetailsModal] = useState(false)
  const [showReportConfigModal, setShowReportConfigModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedPayrollRun, setSelectedPayrollRun] = useState<PayrollRun | null>(null)
  const [selectedReportTemplate, setSelectedReportTemplate] = useState<ReportTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [employeeForm, setEmployeeForm] = useState({
    clientId: '',
    firstName: '',
    lastName: '',
    email: '',
    payType: 'HOURLY',
    payRate: '',
    payFrequency: 'BI_WEEKLY',
    hireDate: new Date().toISOString().split('T')[0],
  })

  const [payrollForm, setPayrollForm] = useState({
    clientId: '',
    payPeriodStart: '',
    payPeriodEnd: '',
    payDate: '',
  })

  useEffect(() => {
    fetchData()
  }, [clientFilter])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (clientFilter !== 'all') params.set('client', clientFilter)

      const [empRes, runRes, clientRes, reportsRes] = await Promise.all([
        fetch(`/api/payroll/employees?${params}`),
        fetch(`/api/payroll/runs?${params}`),
        fetch('/api/clients'),
        fetch('/api/templates/reports?category=PAYROLL'),
      ])

      setEmployees(await empRes.json())
      setPayrollRuns(await runRes.json())
      setClients(await clientRes.json())
      setReportTemplates(await reportsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/payroll/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...employeeForm,
          payRate: parseFloat(employeeForm.payRate),
        }),
      })
      setShowEmployeeModal(false)
      setEmployeeForm({
        clientId: '',
        firstName: '',
        lastName: '',
        email: '',
        payType: 'HOURLY',
        payRate: '',
        payFrequency: 'BI_WEEKLY',
        hireDate: new Date().toISOString().split('T')[0],
      })
      fetchData()
    } catch (error) {
      console.error('Error adding employee:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const clientEmployees = employees.filter(emp => emp.client.id === payrollForm.clientId && emp.status === 'ACTIVE')

      await fetch('/api/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payrollForm,
          employees: clientEmployees.map(emp => ({
            employeeId: emp.id,
            regularHours: emp.payType === 'HOURLY' ? 80 : 0,
            overtimeHours: 0,
            payRate: parseDecimal(emp.payRate),
          })),
        }),
      })
      setShowPayrollModal(false)
      setPayrollForm({
        clientId: '',
        payPeriodStart: '',
        payPeriodEnd: '',
        payDate: '',
      })
      fetchData()
    } catch (error) {
      console.error('Error creating payroll:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getClientName = (client?: Client) => {
    if (!client) return '-'
    return client.businessName || `${client.firstName} ${client.lastName}`
  }

  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length
  const totalPayroll = payrollRuns.reduce((sum, run) => sum + parseDecimal(run.totalGross), 0)

  // Filter employees based on status filter
  const filteredEmployees = employeeStatusFilter === 'all'
    ? employees
    : employees.filter(e => e.status === employeeStatusFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Payroll</h1>
          <p className="text-secondary-600">Manage employees and payroll runs</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            endpoint="/api/reports/export/payroll"
            label="Export"
            filters={{ clientId: clientFilter !== 'all' ? clientFilter : undefined }}
            variant="button"
          />
          <Button variant="secondary" onClick={() => setShowEmployeeModal(true)}>
            <Users className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
          <Button onClick={() => setShowPayrollModal(true)}>
            <Play className="h-4 w-4 mr-2" />
            Run Payroll
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          variant="bordered"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            console.log('Total Employees clicked - current activeTab:', activeTab)
            setActiveTab('employees')
            console.log('After setActiveTab called')
            setEmployeeStatusFilter('all')
          }}
        >
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Employees</p>
              <p className="text-2xl font-bold">{totalEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          variant="bordered"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            console.log('Active clicked - current activeTab:', activeTab)
            setActiveTab('employees')
            console.log('After setActiveTab called')
            setEmployeeStatusFilter('ACTIVE')
          }}
        >
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Active</p>
              <p className="text-2xl font-bold">{activeEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          variant="bordered"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/dashboard/reports')}
        >
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Payroll</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPayroll)}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          variant="bordered"
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('payroll')}
        >
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Pay Runs</p>
              <p className="text-2xl font-bold">{payrollRuns.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card variant="bordered">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 pt-4 flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="payroll">Payroll Runs</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <Select
              options={[{ value: 'all', label: 'All Clients' }, ...clients.map(c => ({
                value: c.id,
                label: getClientName(c),
              }))]}
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-48"
            />
          </div>

          <TabsContent value="employees" className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pay Type</TableHead>
                  <TableHead>Pay Rate</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Hire Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-secondary-500">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp)
                        setShowEmployeeDetailsModal(true)
                      }}
                      className="cursor-pointer hover:bg-secondary-50"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-secondary-500">{emp.employeeNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getClientName(emp.client)}</TableCell>
                      <TableCell>
                        <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'default'}>
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{emp.payType}</TableCell>
                      <TableCell>{formatCurrency(parseDecimal(emp.payRate))}/hr</TableCell>
                      <TableCell>{emp.payFrequency.replace('_', ' ')}</TableCell>
                      <TableCell>{formatDate(emp.hireDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="payroll" className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : payrollRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-secondary-500">
                      No payroll runs found
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollRuns.map((run) => (
                    <TableRow
                      key={run.id}
                      onClick={() => {
                        setSelectedPayrollRun(run)
                        setShowPayrollDetailsModal(true)
                      }}
                      className="cursor-pointer hover:bg-secondary-50"
                    >
                      <TableCell>
                        {formatDate(run.payPeriodStart)} - {formatDate(run.payPeriodEnd)}
                      </TableCell>
                      <TableCell>{getClientName(run.client)}</TableCell>
                      <TableCell>{formatDate(run.payDate)}</TableCell>
                      <TableCell>{run.employeeCount}</TableCell>
                      <TableCell>{formatCurrency(parseDecimal(run.totalGross))}</TableCell>
                      <TableCell>{formatCurrency(parseDecimal(run.totalNet))}</TableCell>
                      <TableCell>
                        <Badge variant={
                          run.status === 'COMPLETED' ? 'success' :
                          run.status === 'PROCESSING' ? 'info' :
                          run.status === 'APPROVED' ? 'success' : 'default'
                        }>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPayrollRun(run)
                              setShowPayrollDetailsModal(true)
                            }}
                            title="View Report"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={async (e) => {
                              e.stopPropagation()
                              // Download payroll report
                              try {
                                const response = await fetch('/api/reports/export/payroll', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    format: 'pdf',
                                    startDate: run.payPeriodStart,
                                    endDate: run.payPeriodEnd,
                                  }),
                                })

                                if (!response.ok) {
                                  throw new Error('Failed to generate report')
                                }

                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `payroll-run-${formatDate(run.payPeriodStart)}.pdf`
                                a.click()
                                window.URL.revokeObjectURL(url)
                              } catch (error) {
                                console.error('Error downloading report:', error)
                                alert('Failed to download report. Please try again.')
                              }
                            }}
                            title="Download"
                          >
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

          <TabsContent value="reports" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.length === 0 ? (
                <p className="text-secondary-500 col-span-full text-center py-8">No report templates found</p>
              ) : (
                reportTemplates.map((report) => (
                  <Card
                    key={report.id}
                    variant="bordered"
                    className="p-4 hover:border-primary-300 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedReportTemplate(report)
                      setShowReportConfigModal(true)
                    }}
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-secondary-100 rounded-lg mr-3">
                        <FileText className="h-5 w-5 text-secondary-600" />
                      </div>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-xs text-secondary-500">{report.description || 'Click to generate'}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Add Employee Modal */}
      <Modal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} title="Add Employee" size="md">
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <Select
            label="Client"
            options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
            value={employeeForm.clientId}
            onChange={(e) => setEmployeeForm({ ...employeeForm, clientId: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={employeeForm.firstName}
              onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={employeeForm.lastName}
              onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={employeeForm.email}
            onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Pay Type"
              options={[
                { value: 'HOURLY', label: 'Hourly' },
                { value: 'SALARY', label: 'Salary' },
              ]}
              value={employeeForm.payType}
              onChange={(e) => setEmployeeForm({ ...employeeForm, payType: e.target.value })}
            />
            <Input
              label="Pay Rate"
              type="number"
              step="0.01"
              value={employeeForm.payRate}
              onChange={(e) => setEmployeeForm({ ...employeeForm, payRate: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Pay Frequency"
              options={[
                { value: 'WEEKLY', label: 'Weekly' },
                { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
                { value: 'SEMI_MONTHLY', label: 'Semi-Monthly' },
                { value: 'MONTHLY', label: 'Monthly' },
              ]}
              value={employeeForm.payFrequency}
              onChange={(e) => setEmployeeForm({ ...employeeForm, payFrequency: e.target.value })}
            />
            <Input
              label="Hire Date"
              type="date"
              value={employeeForm.hireDate}
              onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowEmployeeModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Employee</Button>
          </div>
        </form>
      </Modal>

      {/* Run Payroll Modal */}
      <Modal isOpen={showPayrollModal} onClose={() => setShowPayrollModal(false)} title="Run Payroll" size="md">
        <form onSubmit={handleCreatePayroll} className="space-y-4">
          <Select
            label="Client"
            options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
            value={payrollForm.clientId}
            onChange={(e) => setPayrollForm({ ...payrollForm, clientId: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pay Period Start"
              type="date"
              value={payrollForm.payPeriodStart}
              onChange={(e) => setPayrollForm({ ...payrollForm, payPeriodStart: e.target.value })}
              required
            />
            <Input
              label="Pay Period End"
              type="date"
              value={payrollForm.payPeriodEnd}
              onChange={(e) => setPayrollForm({ ...payrollForm, payPeriodEnd: e.target.value })}
              required
            />
          </div>
          <Input
            label="Pay Date"
            type="date"
            value={payrollForm.payDate}
            onChange={(e) => setPayrollForm({ ...payrollForm, payDate: e.target.value })}
            required
          />
          {payrollForm.clientId && (
            <div className="p-3 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-600">
                {employees.filter(e => e.client.id === payrollForm.clientId && e.status === 'ACTIVE').length} active employees will be included
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowPayrollModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Payroll Run</Button>
          </div>
        </form>
      </Modal>

      {/* Employee Details Modal */}
      <Modal
        isOpen={showEmployeeDetailsModal}
        onClose={() => {
          setShowEmployeeDetailsModal(false)
          setSelectedEmployee(null)
        }}
        title="Employee Details"
        size="lg"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-secondary-200">
              <div>
                <h3 className="text-xl font-bold text-secondary-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                <p className="text-sm text-secondary-500">{selectedEmployee.employeeNumber}</p>
              </div>
              <Badge variant={selectedEmployee.status === 'ACTIVE' ? 'success' : 'default'}>
                {selectedEmployee.status}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Client</h4>
                <p className="text-secondary-900">{getClientName(selectedEmployee.client)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Pay Type</h4>
                <p className="text-secondary-900">{selectedEmployee.payType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Pay Rate</h4>
                <p className="text-secondary-900">{formatCurrency(parseDecimal(selectedEmployee.payRate))}/hr</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Pay Frequency</h4>
                <p className="text-secondary-900">{selectedEmployee.payFrequency.replace('_', ' ')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Hire Date</h4>
                <p className="text-secondary-900">{formatDate(selectedEmployee.hireDate)}</p>
              </div>
              {selectedEmployee.email && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-500 mb-1">Email</h4>
                  <p className="text-secondary-900">{selectedEmployee.email}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Direct Deposit</h4>
                <p className="text-secondary-900">{selectedEmployee.directDepositEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEmployeeDetailsModal(false)
                  setSelectedEmployee(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payroll Run Details Modal */}
      <Modal
        isOpen={showPayrollDetailsModal}
        onClose={() => {
          setShowPayrollDetailsModal(false)
          setSelectedPayrollRun(null)
        }}
        title="Payroll Run Details"
        size="lg"
      >
        {selectedPayrollRun && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-secondary-200">
              <div>
                <h3 className="text-xl font-bold text-secondary-900">Payroll Run</h3>
                <p className="text-sm text-secondary-500">
                  {formatDate(selectedPayrollRun.payPeriodStart)} - {formatDate(selectedPayrollRun.payPeriodEnd)}
                </p>
              </div>
              <Badge variant={
                selectedPayrollRun.status === 'COMPLETED' ? 'success' :
                selectedPayrollRun.status === 'PROCESSING' ? 'info' :
                selectedPayrollRun.status === 'APPROVED' ? 'success' : 'default'
              }>
                {selectedPayrollRun.status}
              </Badge>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-secondary-600">Total Gross</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(parseDecimal(selectedPayrollRun.totalGross))}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-secondary-600">Total Net</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(parseDecimal(selectedPayrollRun.totalNet))}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-sm text-secondary-600">Total Taxes</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(parseDecimal(selectedPayrollRun.totalTaxes))}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Client</h4>
                <p className="text-secondary-900">{getClientName(selectedPayrollRun.client)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Pay Date</h4>
                <p className="text-secondary-900">{formatDate(selectedPayrollRun.payDate)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Employees</h4>
                <p className="text-secondary-900">{selectedPayrollRun.employeeCount}</p>
              </div>
            </div>

            {/* Employee Items */}
            {selectedPayrollRun.items && selectedPayrollRun.items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-3">Employee Breakdown</h4>
                <div className="space-y-2">
                  {selectedPayrollRun.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
                      <span className="font-medium">{item.employee.firstName} {item.employee.lastName}</span>
                      <div className="text-right">
                        <p className="text-sm text-secondary-600">Gross: {formatCurrency(parseDecimal(item.grossPay))}</p>
                        <p className="text-sm font-medium">Net: {formatCurrency(parseDecimal(item.netPay))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPayrollDetailsModal(false)
                  setSelectedPayrollRun(null)
                }}
              >
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  // Print the payroll run details
                  window.print()
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Report
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedPayrollRun) return
                  try {
                    const response = await fetch('/api/reports/export/payroll', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        format: 'pdf',
                        startDate: selectedPayrollRun.payPeriodStart,
                        endDate: selectedPayrollRun.payPeriodEnd,
                      }),
                    })

                    if (!response.ok) {
                      throw new Error('Failed to generate report')
                    }

                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `payroll-run-${formatDate(selectedPayrollRun.payPeriodStart)}.pdf`
                    a.click()
                    window.URL.revokeObjectURL(url)
                  } catch (error) {
                    console.error('Error downloading report:', error)
                    alert('Failed to download report. Please try again.')
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Report Configuration Modal */}
      <Modal
        isOpen={showReportConfigModal}
        onClose={() => {
          setShowReportConfigModal(false)
          setSelectedReportTemplate(null)
        }}
        title={`Generate ${selectedReportTemplate?.name || 'Report'}`}
        size="md"
      >
        {selectedReportTemplate && (
          <div className="space-y-4">
            <p className="text-sm text-secondary-600">
              {selectedReportTemplate.description || 'Configure and generate your payroll report'}
            </p>

            <Select
              label="Client"
              options={[
                { value: '', label: 'Select client' },
                ...clients.map(c => ({
                  value: c.id,
                  label: getClientName(c),
                }))
              ]}
              value={clientFilter === 'all' ? '' : clientFilter}
              onChange={(e) => setClientFilter(e.target.value || 'all')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                defaultValue={new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]}
              />
              <Input
                label="End Date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowReportConfigModal(false)
                  setSelectedReportTemplate(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    // Generate and download report
                    const response = await fetch('/api/reports/export/payroll', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        format: 'pdf',
                        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
                        endDate: new Date().toISOString(),
                      }),
                    })

                    if (!response.ok) {
                      throw new Error('Failed to generate report')
                    }

                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${selectedReportTemplate.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
                    a.click()
                    window.URL.revokeObjectURL(url)
                    setShowReportConfigModal(false)
                    setSelectedReportTemplate(null)
                  } catch (error) {
                    console.error('Error generating report:', error)
                    alert('Failed to generate report. Please try again.')
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Generate & Download
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
