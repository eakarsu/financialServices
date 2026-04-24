'use client'

import { useState } from 'react'
import {
  Link as LinkIcon, Check, X, RefreshCw, Settings, ExternalLink,
  CreditCard, FileText, DollarSign, Users
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  category: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
}

const integrations: Integration[] = [
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Connect bank accounts for automatic transaction import',
    icon: CreditCard,
    category: 'Banking',
    status: 'disconnected',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync accounting data with QuickBooks',
    icon: FileText,
    category: 'Accounting',
    status: 'disconnected',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Two-way sync with Xero accounting',
    icon: FileText,
    category: 'Accounting',
    status: 'disconnected',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept online payments from clients',
    icon: DollarSign,
    category: 'Payments',
    status: 'disconnected',
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Electronic signatures for documents',
    icon: FileText,
    category: 'Documents',
    status: 'disconnected',
  },
  {
    id: 'gusto',
    name: 'Gusto',
    description: 'Sync payroll data with Gusto',
    icon: Users,
    category: 'Payroll',
    status: 'disconnected',
  },
]

export default function IntegrationsPage() {
  const [integrationsState, setIntegrationsState] = useState(integrations)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async (integration: Integration) => {
    setConnecting(true)
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIntegrationsState(prev => prev.map(i =>
      i.id === integration.id
        ? { ...i, status: 'connected' as const, lastSync: new Date().toISOString() }
        : i
    ))
    setConnecting(false)
    setShowConfigModal(false)
  }

  const handleDisconnect = (integrationId: string) => {
    setIntegrationsState(prev => prev.map(i =>
      i.id === integrationId
        ? { ...i, status: 'disconnected' as const, lastSync: undefined }
        : i
    ))
  }

  const categories = Array.from(new Set(integrations.map(i => i.category)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Integrations</h1>
          <p className="text-secondary-600">Connect third-party services to enhance your workflow</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Connected</p>
              <p className="text-2xl font-bold">
                {integrationsState.filter(i => i.status === 'connected').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-secondary-100 rounded-lg mr-4">
              <LinkIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Available</p>
              <p className="text-2xl font-bold">{integrationsState.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center p-4">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Errors</p>
              <p className="text-2xl font-bold">
                {integrationsState.filter(i => i.status === 'error').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations by Category */}
      {categories.map(category => (
        <div key={category}>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrationsState
              .filter(i => i.category === category)
              .map(integration => (
                <Card key={integration.id} variant="bordered">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg mr-3 ${
                          integration.status === 'connected' ? 'bg-green-100' :
                          integration.status === 'error' ? 'bg-red-100' : 'bg-secondary-100'
                        }`}>
                          <integration.icon className={`h-6 w-6 ${
                            integration.status === 'connected' ? 'text-green-600' :
                            integration.status === 'error' ? 'text-red-600' : 'text-secondary-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-secondary-900">{integration.name}</h3>
                          <Badge
                            variant={
                              integration.status === 'connected' ? 'success' :
                              integration.status === 'error' ? 'danger' : 'default'
                            }
                            size="sm"
                          >
                            {integration.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-secondary-500 mb-4">{integration.description}</p>

                    {integration.lastSync && (
                      <p className="text-xs text-secondary-400 mb-4">
                        Last synced: {new Date(integration.lastSync).toLocaleString()}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {integration.status === 'connected' ? (
                        <>
                          <Button variant="secondary" size="sm" className="flex-1">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Sync
                          </Button>
                          <Button variant="secondary" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedIntegration(integration)
                            setShowConfigModal(true)
                          }}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={`Connect ${selectedIntegration?.name}`}
        size="md"
      >
        {selectedIntegration && (
          <div className="space-y-4">
            <p className="text-sm text-secondary-600">
              {selectedIntegration.description}
            </p>

            <div className="p-4 bg-secondary-50 rounded-lg">
              <h4 className="font-medium mb-2">Connection Requirements:</h4>
              <ul className="text-sm text-secondary-600 space-y-1">
                <li>• API credentials from {selectedIntegration.name}</li>
                <li>• Authorization to access your account</li>
                <li>• Data sync permissions</li>
              </ul>
            </div>

            {selectedIntegration.id === 'plaid' && (
              <div className="space-y-3">
                <Input label="Plaid Client ID" placeholder="Enter your Plaid Client ID" />
                <Input label="Plaid Secret" type="password" placeholder="Enter your Plaid Secret" />
              </div>
            )}

            {selectedIntegration.id === 'quickbooks' && (
              <p className="text-sm text-secondary-600">
                You will be redirected to QuickBooks to authorize the connection.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleConnect(selectedIntegration)}
                loading={connecting}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect {selectedIntegration.name}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
