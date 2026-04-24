'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Filter, CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw,
  DollarSign, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Brain, Trash2, Edit
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
import { TableSkeleton } from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import SortableHeader from '@/components/ui/SortableHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'

interface Transaction {
  id: string
  date: string
  description: string
  amount: string
  type: string
  status: string
  isReconciled: boolean
  aiCategorized: boolean
  vendor?: string
  client: { id: string; businessName?: string; firstName?: string; lastName?: string }
  bankAccount?: { id: string; name: string }
  category?: { id: string; name: string; accountNumber: string }
}

interface BankAccount {
  id: string
  name: string
  accountType: string
  balance: string
  institution?: string
  isActive: boolean
  lastSyncedAt?: string
  client: { id: string; businessName?: string; firstName?: string; lastName?: string }
  _count: { transactions: number }
}

interface ChartOfAccount {
  id: string
  accountNumber: string
  name: string
  type: string
  subType?: string
}

interface Client {
  id: string
  businessName?: string
  firstName?: string
  lastName?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function BookkeepingPage() {
  const { toast } = useToast()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientFilter, setClientFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [showCategorizeModal, setShowCategorizeModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Pagination & sorting state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortBy, setSortBy] = useState('date')
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmTitle, setConfirmTitle] = useState('Confirm Action')
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    date: '',
    description: '',
    amount: '',
    type: 'DEBIT',
    categoryId: '',
    bankAccountId: '',
  })

  const [transactionForm, setTransactionForm] = useState({
    clientId: '',
    bankAccountId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'DEBIT',
    categoryId: '',
  })

  const [bankForm, setBankForm] = useState({
    clientId: '',
    name: '',
    accountType: 'CHECKING',
    institution: '',
    balance: '0',
  })

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1)
  }, [clientFilter, statusFilter])

  useEffect(() => {
    fetchData()
  }, [clientFilter, statusFilter, page, limit, sortBy, sortOrder])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (clientFilter !== 'all') params.set('client', clientFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)

      const [txRes, bankRes, coaRes, clientRes] = await Promise.all([
        fetch(`/api/bookkeeping/transactions?${params}`),
        fetch('/api/bookkeeping/bank-accounts'),
        fetch('/api/bookkeeping/chart-of-accounts'),
        fetch('/api/clients'),
      ])

      const txData = await txRes.json()
      setTransactions(txData.data)
      setPagination(txData.pagination)

      setBankAccounts(await bankRes.json())
      setChartOfAccounts(await coaRes.json())
      setClients(await clientRes.json())
    } catch (error) {
      toast('Failed to load bookkeeping data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookkeeping/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transactionForm,
          amount: parseFloat(transactionForm.amount),
          status: transactionForm.categoryId ? 'CATEGORIZED' : 'PENDING',
        }),
      })
      if (!res.ok) throw new Error('Failed to add transaction')
      setShowTransactionModal(false)
      setTransactionForm({
        clientId: '',
        bankAccountId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'DEBIT',
        categoryId: '',
      })
      toast('Transaction added successfully.', 'success')
      fetchData()
    } catch (error) {
      toast('Failed to add transaction. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookkeeping/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bankForm,
          balance: parseFloat(bankForm.balance),
        }),
      })
      if (!res.ok) throw new Error('Failed to add bank account')
      setShowBankModal(false)
      setBankForm({
        clientId: '',
        name: '',
        accountType: 'CHECKING',
        institution: '',
        balance: '0',
      })
      toast('Bank account added successfully.', 'success')
      fetchData()
    } catch (error) {
      toast('Failed to add bank account. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCategorize = async (categoryId: string) => {
    if (!selectedTransaction) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookkeeping/transactions/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, status: 'CATEGORIZED' }),
      })
      if (!res.ok) throw new Error('Failed to categorize transaction')
      setShowCategorizeModal(false)
      setSelectedTransaction(null)
      toast('Transaction categorized successfully.', 'success')
      fetchData()
    } catch (error) {
      toast('Failed to categorize transaction. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTransaction = (tx: Transaction) => {
    setConfirmTitle('Delete Transaction')
    setConfirmMessage(`Are you sure you want to delete the transaction "${tx.description}"? This action cannot be undone.`)
    setConfirmAction(() => async () => {
      setConfirmLoading(true)
      try {
        const res = await fetch(`/api/bookkeeping/transactions/${tx.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error('Failed to delete transaction')
        setShowConfirmDialog(false)
        setShowDetailsModal(false)
        setSelectedTransaction(null)
        toast('Transaction deleted successfully.', 'success')
        fetchData()
      } catch (error) {
        toast('Failed to delete transaction. Please try again.', 'error')
      } finally {
        setConfirmLoading(false)
      }
    })
    setShowConfirmDialog(true)
  }

  const handleEditTransaction = (tx: Transaction) => {
    setEditForm({
      date: tx.date.split('T')[0],
      description: tx.description,
      amount: String(parseDecimal(tx.amount)),
      type: tx.type,
      categoryId: tx.category?.id || '',
      bankAccountId: tx.bankAccount?.id || '',
    })
    setShowDetailsModal(false)
    setShowEditModal(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTransaction) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookkeeping/transactions/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          amount: parseFloat(editForm.amount),
          status: editForm.categoryId ? 'CATEGORIZED' : 'PENDING',
        }),
      })
      if (!res.ok) throw new Error('Failed to update transaction')
      setShowEditModal(false)
      setSelectedTransaction(null)
      toast('Transaction updated successfully.', 'success')
      fetchData()
    } catch (error) {
      toast('Failed to update transaction. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const getClientName = (client?: Client) => {
    if (!client) return '-'
    return client.businessName || `${client.firstName} ${client.lastName}`
  }

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + parseDecimal(acc.balance), 0)
  const pendingCount = transactions.filter(t => t.status === 'PENDING').length
  const categorizedCount = transactions.filter(t => t.status === 'CATEGORIZED').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Bookkeeping</h1>
          <p className="text-secondary-600">Manage transactions and bank accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowBankModal(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
          <Button onClick={() => setShowTransactionModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Bank Accounts</p>
              <p className="text-2xl font-bold">{bankAccounts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Categorized</p>
              <p className="text-2xl font-bold">{categorizedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card variant="bordered">
        <Tabs defaultValue="transactions">
          <div className="px-4 pt-4 flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
              <TabsTrigger value="chart">Chart of Accounts</TabsTrigger>
              <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
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
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'CATEGORIZED', label: 'Categorized' },
                  { value: 'REVIEWED', label: 'Reviewed' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              />
              <ExportButton
                endpoint="/api/reports/export/transactions"
                label="Export"
                filters={{
                  clientId: clientFilter !== 'all' ? clientFilter : undefined,
                  status: statusFilter !== 'all' ? statusFilter : undefined,
                }}
                variant="button"
              />
            </div>
          </div>

          <TabsContent value="transactions" className="p-4">
            {loading ? (
              <TableSkeleton rows={8} cols={7} />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader
                        label="Date"
                        sortKey="date"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Description"
                        sortKey="description"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <TableHead>Client</TableHead>
                      <TableHead>Category</TableHead>
                      <SortableHeader
                        label="Status"
                        sortKey="status"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Amount"
                        sortKey="amount"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                        className="text-right"
                      />
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-secondary-500">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow
                          key={tx.id}
                          onClick={() => {
                            setSelectedTransaction(tx)
                            setShowDetailsModal(true)
                          }}
                          className="cursor-pointer hover:bg-secondary-50"
                        >
                          <TableCell>{formatDate(tx.date)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              {tx.vendor && <p className="text-xs text-secondary-500">{tx.vendor}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{getClientName(tx.client)}</TableCell>
                          <TableCell>
                            {tx.category ? (
                              <span className="text-sm">{tx.category.accountNumber} - {tx.category.name}</span>
                            ) : (
                              <span className="text-secondary-400">Uncategorized</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                tx.status === 'CATEGORIZED' || tx.status === 'REVIEWED' ? 'success' :
                                tx.status === 'PENDING' ? 'warning' : 'default'
                              }>
                                {tx.status}
                              </Badge>
                              {tx.aiCategorized && (
                                <span title="AI Categorized"><Brain className="h-4 w-4 text-purple-500" /></span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                              {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(parseDecimal(tx.amount))}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTransaction(tx)
                                setShowCategorizeModal(true)
                              }}
                            >
                              Categorize
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {pagination.total > 0 && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="accounts" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((account) => (
                <Card key={account.id} variant="bordered" className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-xs text-secondary-500">{account.institution || account.accountType}</p>
                      </div>
                    </div>
                    <Badge variant={account.isActive ? 'success' : 'default'}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(parseDecimal(account.balance))}</p>
                      <p className="text-xs text-secondary-500">{account._count.transactions} transactions</p>
                    </div>
                    <div className="text-right text-xs text-secondary-500">
                      {account.lastSyncedAt && (
                        <p>Last synced: {formatDate(account.lastSyncedAt)}</p>
                      )}
                      <p>{getClientName(account.client)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chart" className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sub-Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartOfAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">{account.accountNumber}</TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell><Badge variant="outline">{account.type}</Badge></TableCell>
                    <TableCell>{account.subType || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="reconciliation" className="p-4">
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">Bank Reconciliation</h3>
              <p className="text-secondary-600 mb-4">Select a bank account to start reconciliation</p>
              <Select
                options={[{ value: '', label: 'Select bank account' }, ...bankAccounts.map(a => ({
                  value: a.id,
                  label: `${a.name} - ${getClientName(a.client)}`,
                }))]}
                className="max-w-md mx-auto"
              />
              <Button className="mt-4">Start Reconciliation</Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Add Transaction Modal */}
      <Modal isOpen={showTransactionModal} onClose={() => setShowTransactionModal(false)} title="Add Transaction" size="md">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <Select
            label="Client"
            options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
            value={transactionForm.clientId}
            onChange={(e) => setTransactionForm({ ...transactionForm, clientId: e.target.value })}
            required
          />
          <Select
            label="Bank Account"
            options={[{ value: '', label: 'Select account' }, ...bankAccounts.filter(a => !transactionForm.clientId || a.client.id === transactionForm.clientId).map(a => ({
              value: a.id,
              label: a.name,
            }))]}
            value={transactionForm.bankAccountId}
            onChange={(e) => setTransactionForm({ ...transactionForm, bankAccountId: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            value={transactionForm.date}
            onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={transactionForm.description}
            onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={transactionForm.amount}
              onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
              required
            />
            <Select
              label="Type"
              options={[
                { value: 'DEBIT', label: 'Debit (Expense)' },
                { value: 'CREDIT', label: 'Credit (Income)' },
              ]}
              value={transactionForm.type}
              onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
            />
          </div>
          <Select
            label="Category"
            options={[{ value: '', label: 'Select category' }, ...chartOfAccounts.map(a => ({
              value: a.id,
              label: `${a.accountNumber} - ${a.name}`,
            }))]}
            value={transactionForm.categoryId}
            onChange={(e) => setTransactionForm({ ...transactionForm, categoryId: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowTransactionModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Transaction</Button>
          </div>
        </form>
      </Modal>

      {/* Add Bank Account Modal */}
      <Modal isOpen={showBankModal} onClose={() => setShowBankModal(false)} title="Add Bank Account" size="md">
        <form onSubmit={handleAddBankAccount} className="space-y-4">
          <Select
            label="Client"
            options={[{ value: '', label: 'Select client' }, ...clients.map(c => ({
              value: c.id,
              label: getClientName(c),
            }))]}
            value={bankForm.clientId}
            onChange={(e) => setBankForm({ ...bankForm, clientId: e.target.value })}
            required
          />
          <Input
            label="Account Name"
            value={bankForm.name}
            onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
            required
            placeholder="e.g., Business Checking"
          />
          <Select
            label="Account Type"
            options={[
              { value: 'CHECKING', label: 'Checking' },
              { value: 'SAVINGS', label: 'Savings' },
              { value: 'CREDIT_CARD', label: 'Credit Card' },
              { value: 'LOAN', label: 'Loan' },
              { value: 'INVESTMENT', label: 'Investment' },
            ]}
            value={bankForm.accountType}
            onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
          />
          <Input
            label="Institution"
            value={bankForm.institution}
            onChange={(e) => setBankForm({ ...bankForm, institution: e.target.value })}
            placeholder="e.g., Chase, Bank of America"
          />
          <Input
            label="Current Balance"
            type="number"
            step="0.01"
            value={bankForm.balance}
            onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowBankModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Account</Button>
          </div>
        </form>
      </Modal>

      {/* Categorize Modal */}
      <Modal isOpen={showCategorizeModal} onClose={() => setShowCategorizeModal(false)} title="Categorize Transaction" size="md">
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary-50 rounded-lg">
              <p className="font-medium">{selectedTransaction.description}</p>
              <p className="text-sm text-secondary-600">
                {formatDate(selectedTransaction.date)} • {selectedTransaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(parseDecimal(selectedTransaction.amount))}
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700">Select Category</label>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {chartOfAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleCategorize(account.id)}
                    disabled={submitting}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors flex justify-between items-center"
                  >
                    <span className="font-mono text-sm text-secondary-500">{account.accountNumber}</span>
                    <span className="text-sm">{account.name}</span>
                    <Badge variant="outline" size="sm">{account.type}</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedTransaction(null)
        }}
        title="Transaction Details"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-secondary-200">
              <div>
                <h3 className="text-xl font-bold text-secondary-900">{selectedTransaction.description}</h3>
                <p className="text-sm text-secondary-500">{formatDate(selectedTransaction.date)}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${selectedTransaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTransaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(parseDecimal(selectedTransaction.amount))}
                </p>
                <Badge variant={
                  selectedTransaction.status === 'CATEGORIZED' || selectedTransaction.status === 'REVIEWED' ? 'success' :
                  selectedTransaction.status === 'PENDING' ? 'warning' : 'default'
                }>
                  {selectedTransaction.status}
                </Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Client</h4>
                <p className="text-secondary-900">{getClientName(selectedTransaction.client)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Transaction Type</h4>
                <p className="text-secondary-900">{selectedTransaction.type}</p>
              </div>
              {selectedTransaction.vendor && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-500 mb-1">Vendor</h4>
                  <p className="text-secondary-900">{selectedTransaction.vendor}</p>
                </div>
              )}
              {selectedTransaction.bankAccount && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-500 mb-1">Bank Account</h4>
                  <p className="text-secondary-900">{selectedTransaction.bankAccount.name}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Category</h4>
                <p className="text-secondary-900">
                  {selectedTransaction.category ? (
                    <span>{selectedTransaction.category.accountNumber} - {selectedTransaction.category.name}</span>
                  ) : (
                    <span className="text-secondary-400">Uncategorized</span>
                  )}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-secondary-500 mb-1">Reconciled</h4>
                <p className="text-secondary-900">{selectedTransaction.isReconciled ? 'Yes' : 'No'}</p>
              </div>
              {selectedTransaction.aiCategorized && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-purple-900">This transaction was categorized using AI</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-secondary-200">
              <Button
                variant="danger"
                onClick={() => handleDeleteTransaction(selectedTransaction)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedTransaction(null)
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEditTransaction(selectedTransaction)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowCategorizeModal(true)
                  }}
                >
                  Categorize
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedTransaction(null)
        }}
        title="Edit Transaction"
        size="md"
      >
        {selectedTransaction && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              label="Date"
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              required
            />
            <Input
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                required
              />
              <Select
                label="Type"
                options={[
                  { value: 'DEBIT', label: 'Debit (Expense)' },
                  { value: 'CREDIT', label: 'Credit (Income)' },
                ]}
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              />
            </div>
            <Select
              label="Bank Account"
              options={[{ value: '', label: 'Select account' }, ...bankAccounts.filter(a => a.client.id === selectedTransaction.client.id).map(a => ({
                value: a.id,
                label: a.name,
              }))]}
              value={editForm.bankAccountId}
              onChange={(e) => setEditForm({ ...editForm, bankAccountId: e.target.value })}
            />
            <Select
              label="Category"
              options={[{ value: '', label: 'Select category' }, ...chartOfAccounts.map(a => ({
                value: a.id,
                label: `${a.accountNumber} - ${a.name}`,
              }))]}
              value={editForm.categoryId}
              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedTransaction(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false)
          setConfirmAction(null)
        }}
        onConfirm={() => {
          if (confirmAction) confirmAction()
        }}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Delete"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  )
}
