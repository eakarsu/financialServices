'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3, FileText, TrendingUp, DollarSign, PieChart, Download, Printer,
  Calendar, Building
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ExportButton from '@/components/ExportButton'
import { formatDate, formatCurrency } from '@/lib/utils'

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
  config?: Record<string, unknown>
}

interface ReportData {
  type: string
  client: Client
  startDate: string
  endDate: string
  generatedAt: string
  data: Record<string, unknown>
}

const reportIcons: Record<string, typeof TrendingUp> = {
  PROFIT_LOSS: TrendingUp,
  BALANCE_SHEET: BarChart3,
  CASH_FLOW: DollarSign,
  TRIAL_BALANCE: FileText,
  GENERAL_LEDGER: FileText,
  BUDGET_VS_ACTUAL: PieChart,
}

export default function ReportsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedReport, setSelectedReport] = useState('')
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const [showCategoryDetailsModal, setShowCategoryDetailsModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<{ account: { name: string; type: string }; total: number } | null>(null)

  useEffect(() => {
    fetchClients()
    fetchReportTemplates()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      setClients(await res.json())
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchReportTemplates = async () => {
    try {
      const res = await fetch('/api/templates/reports?category=FINANCIAL')
      setReportTemplates(await res.json())
    } catch (error) {
      console.error('Error fetching report templates:', error)
    }
  }

  const generateReport = async () => {
    if (!selectedClient || !selectedReport) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        client: selectedClient,
        startDate,
        endDate,
      })
      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()
      setReport(data)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const getClientName = (client?: Client) => {
    if (!client) return '-'
    return client.businessName || `${client.firstName} ${client.lastName}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Financial Reports</h1>
          <p className="text-secondary-600">Generate and view financial reports</p>
        </div>
      </div>

      {/* Report Generator */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Client"
              options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
                value: c.id,
                label: getClientName(c),
              }))]}
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            />
            <Select
              label="Report Type"
              options={[{ value: '', label: 'Select report' }, ...reportTemplates.map(r => ({
                value: r.id,
                label: r.name,
              }))]}
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
            />
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={generateReport} loading={loading} disabled={!selectedClient || !selectedReport}>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      {!report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.length === 0 ? (
            <p className="text-secondary-500 col-span-full text-center py-8">No report templates available</p>
          ) : (
            reportTemplates.map((template) => {
              const IconComponent = reportIcons[template.name.toUpperCase().replace(/ /g, '_').replace('&', '')] || FileText
              return (
                <Card
                  key={template.id}
                  variant="bordered"
                  className="p-4 cursor-pointer hover:border-primary-300 transition-colors"
                  onClick={() => setSelectedReport(template.id)}
                >
                  <div className="flex items-start">
                    <div className="p-3 bg-primary-100 rounded-lg mr-4">
                      <IconComponent className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-secondary-900">{template.name}</h3>
                      <p className="text-sm text-secondary-500">{template.description || 'Generate this report'}</p>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Generated Report */}
      {report && (
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {reportTemplates.find(r => r.id === selectedReport)?.name || report.type}
                </CardTitle>
                <p className="text-sm text-secondary-500 mt-1">
                  {getClientName(report.client)} | {formatDate(report.startDate)} - {formatDate(report.endDate)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <ExportButton
                  endpoint="/api/reports/export/financial-summary"
                  label="Export"
                  filters={{ startDate, endDate }}
                  variant="button"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(report.type === 'PROFIT_LOSS' || report.type === 'report-009') && report.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency((report.data as { revenue: number }).revenue || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency((report.data as { expenses: number }).expenses || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Net Income</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency((report.data as { netIncome: number }).netIncome || 0)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">By Category</h4>
                  <div className="space-y-2">
                    {((report.data as { byCategory: Array<{ account: { name: string; type: string }; total: number }> }).byCategory || []).map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100 transition-colors"
                        onClick={() => {
                          setSelectedCategory(item)
                          setShowCategoryDetailsModal(true)
                        }}
                      >
                        <div className="flex items-center">
                          <Badge variant={item.account.type === 'REVENUE' ? 'success' : 'danger'} size="sm" className="mr-2">
                            {item.account.type}
                          </Badge>
                          <span>{item.account.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(report.type === 'BALANCE_SHEET' || report.type === 'report-010') && report.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Assets */}
                  <div>
                    <h4 className="font-medium mb-4 text-green-700">Assets</h4>
                    <div className="space-y-2">
                      {((report.data as any).assets || []).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">{item.account.name}</span>
                          <span className="text-sm font-medium">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-green-200 font-bold">
                        <span>Total Assets</span>
                        <span className="text-green-700">{formatCurrency((report.data as any).totalAssets || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <h4 className="font-medium mb-4 text-red-700">Liabilities</h4>
                    <div className="space-y-2">
                      {((report.data as any).liabilities || []).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between p-2 bg-red-50 rounded">
                          <span className="text-sm">{item.account.name}</span>
                          <span className="text-sm font-medium">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-red-200 font-bold">
                        <span>Total Liabilities</span>
                        <span className="text-red-700">{formatCurrency((report.data as any).totalLiabilities || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div>
                    <h4 className="font-medium mb-4 text-blue-700">Equity</h4>
                    <div className="space-y-2">
                      {((report.data as any).equity || []).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between p-2 bg-blue-50 rounded">
                          <span className="text-sm">{item.account.name}</span>
                          <span className="text-sm font-medium">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      {(report.data as any).retainedEarnings !== undefined && (
                        <div className="flex justify-between p-2 bg-blue-50 rounded">
                          <span className="text-sm">Retained Earnings</span>
                          <span className="text-sm font-medium">{formatCurrency((report.data as any).retainedEarnings)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-blue-200 font-bold">
                        <span>Total Equity</span>
                        <span className="text-blue-700">{formatCurrency((report.data as any).totalEquity || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Check */}
                <div className="mt-6 p-4 bg-secondary-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Balance Check (Assets = Liabilities + Equity):</span>
                    <span className={`font-bold ${
                      Math.abs(((report.data as any).totalAssets || 0) - (((report.data as any).totalLiabilities || 0) + ((report.data as any).totalEquity || 0))) < 0.01
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatCurrency((report.data as any).totalAssets || 0)} = {formatCurrency(((report.data as any).totalLiabilities || 0) + ((report.data as any).totalEquity || 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {(report.type === 'CASH_FLOW' || report.type === 'report-011') && report.data && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Operating Activities</h4>
                  <div className="space-y-2 bg-secondary-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency((report.data as any).operatingActivities?.revenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency((report.data as any).operatingActivities?.expenses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Net Cash from Operations</span>
                      <span className="font-bold">
                        {formatCurrency((report.data as any).operatingActivities?.netCashFromOperations || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Net Cash Change</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency((report.data as any).netCashChange || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Beginning Cash</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {formatCurrency((report.data as any).beginningCash || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Ending Cash</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency((report.data as any).endingCash || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(report.type === 'AR_AGING' || report.type === 'report-012') && report.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-5 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Current</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency((report.data as any).totals?.current || 0)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {(report.data as any).aging?.current?.length || 0} invoices
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-600">1-30 Days</p>
                    <p className="text-xl font-bold text-yellow-700">
                      {formatCurrency((report.data as any).totals?.thirtyDays || 0)}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      {(report.data as any).aging?.thirtyDays?.length || 0} invoices
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">31-60 Days</p>
                    <p className="text-xl font-bold text-orange-700">
                      {formatCurrency((report.data as any).totals?.sixtyDays || 0)}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      {(report.data as any).aging?.sixtyDays?.length || 0} invoices
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">61-90 Days</p>
                    <p className="text-xl font-bold text-red-700">
                      {formatCurrency((report.data as any).totals?.ninetyDays || 0)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {(report.data as any).aging?.ninetyDays?.length || 0} invoices
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Over 90 Days</p>
                    <p className="text-xl font-bold text-purple-700">
                      {formatCurrency((report.data as any).totals?.overNinety || 0)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {(report.data as any).aging?.overNinety?.length || 0} invoices
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Total Outstanding</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {formatCurrency((report.data as any).totalOutstanding || 0)}
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-secondary-400 mt-6 text-right">
              Generated: {formatDate(report.generatedAt)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category Details Modal */}
      {selectedCategory && report && (
        <Modal
          isOpen={showCategoryDetailsModal}
          onClose={() => setShowCategoryDetailsModal(false)}
          title="Category Details"
          size="md"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedCategory.account.name}</h3>
                <p className="text-secondary-600">{getClientName(report.client)}</p>
              </div>
              <Badge variant={selectedCategory.account.type === 'REVENUE' ? 'success' : 'danger'}>
                {selectedCategory.account.type}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Account Type</p>
                <p className="font-medium">{selectedCategory.account.type}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Total Amount</p>
                <p className={`font-medium text-lg ${selectedCategory.account.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedCategory.total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Period</p>
                <p className="font-medium">{formatDate(report.startDate)} - {formatDate(report.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Report Type</p>
                <p className="font-medium">{report.type.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                This category shows the total {selectedCategory.account.type.toLowerCase()} of {formatCurrency(selectedCategory.total)} for {selectedCategory.account.name} during the selected period.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button variant="secondary" onClick={() => setShowCategoryDetailsModal(false)}>Close</Button>
              <ExportButton
                endpoint="/api/reports/export/category-detail"
                label="Export Details"
                filters={{
                  category: selectedCategory.account.name,
                  startDate: report.startDate,
                  endDate: report.endDate
                }}
                variant="button"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
