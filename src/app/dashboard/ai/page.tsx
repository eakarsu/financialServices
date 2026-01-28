'use client'

import { useState } from 'react'
import {
  Brain, Zap, Search, FileText, DollarSign, AlertTriangle, Mail,
  TrendingUp, Sparkles, CheckCircle, ArrowRight
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface AIFeature {
  id: string
  name: string
  description: string
  icon: React.ElementType
  action: string
}

const aiFeatures: AIFeature[] = [
  {
    id: 'categorizer',
    name: 'AI Transaction Categorizer',
    description: 'Automatically categorize transactions using machine learning',
    icon: Zap,
    action: 'Categorize Transactions',
  },
  {
    id: 'receipt',
    name: 'AI Receipt Processor',
    description: 'Extract data from receipts and invoices automatically',
    icon: FileText,
    action: 'Process Receipts',
  },
  {
    id: 'deductions',
    name: 'AI Tax Deduction Finder',
    description: 'Identify potential tax deductions from transactions',
    icon: DollarSign,
    action: 'Find Deductions',
  },
  {
    id: 'anomaly',
    name: 'AI Anomaly Detector',
    description: 'Flag unusual transactions and potential issues',
    icon: AlertTriangle,
    action: 'Detect Anomalies',
  },
  {
    id: 'insights',
    name: 'AI Financial Insights',
    description: 'Get AI-powered analysis and recommendations',
    icon: TrendingUp,
    action: 'Generate Insights',
  },
  {
    id: 'email',
    name: 'AI Client Communication',
    description: 'Draft professional emails and messages',
    icon: Mail,
    action: 'Draft Email',
  },
]

export default function AIPage() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [inputData, setInputData] = useState({
    description: '',
    clientName: '',
    topic: '',
    context: '',
  })
  const [featureDataMode, setFeatureDataMode] = useState<Record<string, boolean>>({
    categorizer: false,
    deductions: false,
    anomaly: false,
    insights: false,
    receipt: false,
    email: false,
  })

  const runAIFeature = async (featureId: string) => {
    setLoading(true)
    setResult(null)

    try {
      let type = ''
      let data: Record<string, unknown> = {}

      switch (featureId) {
        case 'categorizer':
          type = 'CATEGORIZE_TRANSACTION'
          data = {
            description: inputData.description || 'Office Depot - Office Supplies Purchase',
            amount: 150.00
          }
          break
        case 'deductions':
          type = 'FIND_DEDUCTIONS'
          if (featureDataMode[featureId]) {
            const transactionsRes = await fetch('/api/bookkeeping/transactions')
            const transactions = await transactionsRes.json()

            const expenseTransactions = Array.isArray(transactions)
              ? transactions
                  .filter((tx: { type: string }) => tx.type === 'DEBIT')
                  .map((tx: { category: string; amount: number; description: string }) => ({
                    category: tx.category || 'Uncategorized',
                    amount: tx.amount,
                    description: tx.description || 'No description'
                  }))
                  .slice(0, 20) // Limit to 20 transactions
              : []

            data = {
              transactions: expenseTransactions.length > 0 ? expenseTransactions : [
                { category: 'Office Supplies', amount: 500, description: 'Printer, paper, and office materials' },
              ]
            }
          } else {
            data = {
              transactions: [
                { category: 'Office Supplies', amount: 500, description: 'Printer, paper, and office materials' },
                { category: 'Travel', amount: 1200, description: 'Business trip to client site' },
                { category: 'Software', amount: 300, description: 'Annual accounting software subscription' },
                { category: 'Professional Services', amount: 2500, description: 'Legal consultation fees' },
                { category: 'Meals & Entertainment', amount: 450, description: 'Client dinner meetings' },
                { category: 'Utilities', amount: 320, description: 'Office internet and phone' },
              ],
            }
          }
          break
        case 'anomaly':
          type = 'DETECT_ANOMALIES'
          if (featureDataMode[featureId]) {
            const transactionsRes = await fetch('/api/bookkeeping/transactions')
            const transactions = await transactionsRes.json()

            const recentTransactions = Array.isArray(transactions)
              ? transactions
                  .map((tx: { id: string; amount: number; description: string; date: string }) => ({
                    id: tx.id,
                    amount: tx.amount,
                    description: tx.description || 'No description',
                    date: tx.date
                  }))
                  .slice(0, 20) // Limit to 20 transactions
              : []

            data = {
              transactions: recentTransactions.length > 0 ? recentTransactions : [
                { id: 'tx-001', amount: 100, description: 'No real transactions found', date: '2024-11-15' },
              ]
            }
          } else {
            data = {
              transactions: [
                { id: 'tx-001', amount: 100, description: 'Office supplies - Staples', date: '2024-11-15' },
                { id: 'tx-002', amount: 120, description: 'Software subscription', date: '2024-11-16' },
                { id: 'tx-003', amount: 95, description: 'Utilities payment', date: '2024-11-17' },
                { id: 'tx-004', amount: 5000, description: 'Equipment purchase', date: '2024-11-18' },
                { id: 'tx-005', amount: 100, description: 'Office supplies - Staples', date: '2024-11-18' },
                { id: 'tx-006', amount: 999.99, description: 'AMZN PAYMENT', date: '2024-11-25' },
              ],
            }
          }
          break
        case 'insights':
          type = 'GENERATE_INSIGHTS'
          if (featureDataMode[featureId]) {
            // Fetch real financial data from the database
            const [invoicesRes, transactionsRes] = await Promise.all([
              fetch('/api/practice/invoices'),
              fetch('/api/bookkeeping/transactions')
            ])

            const invoices = await invoicesRes.json()
            const transactions = await transactionsRes.json()

            const revenue = Array.isArray(invoices) ? invoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0) : 0
            const expenses = Array.isArray(transactions)
              ? transactions
                  .filter((tx: { type: string }) => tx.type === 'DEBIT')
                  .reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0)
              : 0
            const profit = revenue - expenses

            data = {
              revenue,
              expenses,
              profit,
              period: 'Current Period'
            }
          } else {
            data = {
              revenue: 125000,
              expenses: 87500,
              profit: 37500,
              period: 'Q4 2024 (Sample Data)'
            }
          }
          break
        case 'receipt':
          type = 'PROCESS_RECEIPT'
          data = {
            text: `OFFICE DEPOT
Store #1234
123 Main Street
Date: 11/28/2024
Time: 14:32

HP Printer Paper (5 reams)    $45.99
Stapler, Heavy Duty           $24.99
File Folders (Box of 100)     $18.99
Pens, Black (12 pack)         $8.99
Desk Organizer                $35.99

Subtotal:                     $134.95
Tax (8.5%):                   $11.47
TOTAL:                        $146.42

Payment Method: VISA ****1234
Thank you for your business!`,
            imageDescription: 'Receipt from Office Depot showing office supply purchases'
          }
          break
        case 'email':
          type = 'DRAFT_EMAIL'
          data = {
            clientName: inputData.clientName || 'John Smith',
            topic: inputData.topic || 'tax return',
            context: inputData.context || 'We need additional documents for your 2024 tax return.',
          }
          break
        default:
          return
      }

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      })

      const resultData = await res.json()
      console.log('AI Feature:', featureId, 'Type:', type, 'Result:', resultData)
      setResult(resultData)
    } catch (error) {
      console.error('AI feature error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">AI Features</h1>
          <p className="text-secondary-600">Leverage AI to automate and enhance your workflow</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-500">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Powered by AI
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiFeatures.map((feature) => (
          <Card
            key={feature.id}
            variant="bordered"
            className={`cursor-pointer transition-all ${selectedFeature === feature.id ? 'border-primary-500 ring-2 ring-primary-200' : 'hover:border-primary-300'}`}
            onClick={() => setSelectedFeature(feature.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <feature.icon className="h-6 w-6 text-purple-600" />
                </div>
                {selectedFeature === feature.id && (
                  <Badge variant="info" size="sm">Selected</Badge>
                )}
              </div>
              <h3 className="font-semibold text-secondary-900 mb-2">{feature.name}</h3>
              <p className="text-sm text-secondary-500 mb-4">{feature.description}</p>

              {/* Data Source Toggle for this feature */}
              <label
                className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={featureDataMode[feature.id]}
                  onChange={(e) => {
                    e.stopPropagation()
                    setFeatureDataMode({ ...featureDataMode, [feature.id]: e.target.checked })
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-xs font-medium text-blue-900">
                  {featureDataMode[feature.id] ? 'Using Real Data' : 'Using Sample Data'}
                </span>
              </label>

              <Button
                variant={selectedFeature === feature.id ? 'primary' : 'secondary'}
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFeature(feature.id)
                  runAIFeature(feature.id)
                }}
                loading={loading && selectedFeature === feature.id}
              >
                <Brain className="h-4 w-4 mr-2" />
                {feature.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input Section */}
      {selectedFeature && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Input Data</CardTitle>
            <CardDescription>Provide data for the AI to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFeature === 'categorizer' && (
              <Input
                label="Transaction Description"
                value={inputData.description}
                onChange={(e) => setInputData({ ...inputData, description: e.target.value })}
                placeholder="e.g., AMAZON.COM - Office supplies purchase"
              />
            )}
            {selectedFeature === 'email' && (
              <>
                <Input
                  label="Client Name"
                  value={inputData.clientName}
                  onChange={(e) => setInputData({ ...inputData, clientName: e.target.value })}
                  placeholder="John Smith"
                />
                <Input
                  label="Topic"
                  value={inputData.topic}
                  onChange={(e) => setInputData({ ...inputData, topic: e.target.value })}
                  placeholder="e.g., tax return, invoice, documents"
                />
                <Textarea
                  label="Context"
                  value={inputData.context}
                  onChange={(e) => setInputData({ ...inputData, context: e.target.value })}
                  placeholder="Additional context for the email..."
                  rows={3}
                />
              </>
            )}
            <Button onClick={() => runAIFeature(selectedFeature)} loading={loading}>
              Run Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>AI Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {selectedFeature === 'categorizer' && result.category && (
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Suggested Category:</span>
                  <Badge variant="success">{result.category as string}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-500">Confidence:</span>
                  <span className="text-sm font-medium">{((result.confidence as number) * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}

            {selectedFeature === 'deductions' && (result as { deductions: Array<{ category: string; amount: number; description: string }> }).deductions && (
              <div className="space-y-3">
                <p className="text-sm text-secondary-600 mb-4">Potential tax deductions identified:</p>
                {(result as { deductions: Array<{ category: string; amount: number; description: string }> }).deductions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">{d.category}</p>
                      <p className="text-sm text-green-600">{d.description}</p>
                    </div>
                    <span className="font-bold text-green-700">{formatCurrency(d.amount)}</span>
                  </div>
                ))}
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Total Potential Deductions:</strong>{' '}
                    {formatCurrency((result as { deductions: Array<{ amount: number }> }).deductions.reduce((sum, d) => sum + d.amount, 0))}
                  </p>
                </div>
              </div>
            )}

            {selectedFeature === 'anomaly' && (result as { anomalies: Array<{ reason: string; severity: string }> }).anomalies && (
              <div className="space-y-3">
                {(result as { anomalies: Array<{ reason: string; severity: string }> }).anomalies.length === 0 ? (
                  <p className="text-green-600">No anomalies detected!</p>
                ) : (
                  (result as { anomalies: Array<{ reason: string; severity: string }> }).anomalies.map((a, i) => (
                    <div key={i} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                      <div>
                        <p className="font-medium text-yellow-800">{a.reason}</p>
                        <Badge variant="warning" size="sm">{a.severity}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedFeature === 'insights' && (result as { insights: Array<{ title: string; description: string; severity: string }> }).insights && (
              <div className="space-y-3">
                {(result as { insights: Array<{ title: string; description: string; severity: string }> }).insights.map((insight, i) => (
                  <div key={i} className={`p-4 rounded-lg ${
                    insight.severity === 'OPPORTUNITY' ? 'bg-green-50' :
                    insight.severity === 'WARNING' ? 'bg-yellow-50' : 'bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{insight.title}</p>
                      <Badge variant={
                        insight.severity === 'OPPORTUNITY' ? 'success' :
                        insight.severity === 'WARNING' ? 'warning' : 'info'
                      } size="sm">
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary-600">{insight.description}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedFeature === 'receipt' && result.vendor && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-secondary-500 mb-1">Vendor:</p>
                    <p className="p-3 bg-secondary-50 rounded-lg font-medium">{(result.vendor as string)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-500 mb-1">Total Amount:</p>
                    <p className="p-3 bg-secondary-50 rounded-lg font-medium">{formatCurrency(result.amount as number)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-500 mb-1">Date:</p>
                    <p className="p-3 bg-secondary-50 rounded-lg">{result.date as string}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-500 mb-1">Category:</p>
                    <Badge variant="info">{result.category as string}</Badge>
                  </div>
                </div>
                {(result as { items: Array<{ description: string; amount: number }> }).items && (result as { items: Array<{ description: string; amount: number }> }).items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary-500 mb-2">Line Items:</p>
                    <div className="space-y-2">
                      {(result as { items: Array<{ description: string; amount: number }> }).items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-secondary-50 rounded">
                          <span className="text-sm">{item.description}</span>
                          <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedFeature === 'email' && result.subject && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-secondary-500 mb-1">Subject:</p>
                  <p className="p-3 bg-secondary-50 rounded-lg">{result.subject as string}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-500 mb-1">Body:</p>
                  <pre className="p-3 bg-secondary-50 rounded-lg whitespace-pre-wrap text-sm font-sans">
                    {result.body as string}
                  </pre>
                </div>
                <Button variant="secondary">
                  <Mail className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
