'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface Client {
  id: string
  type: string
  status: string
  firstName?: string
  lastName?: string
  businessName?: string
  entityType?: string
  ssn?: string
  ein?: string
  dateOfBirth?: string
  email?: string
  phone?: string
  mobilePhone?: string
  address?: string
  address2?: string
  city?: string
  state?: string
  zipCode?: string
  billingEmail?: string
  billingAddress?: string
  billingCity?: string
  billingState?: string
  billingZipCode?: string
  portalEnabled: boolean
  portalEmail?: string
}

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Client | null>(null)

  useEffect(() => {
    fetchClient()
  }, [resolvedParams.id])

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setFormData(data)
      } else {
        router.push('/dashboard/clients')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/clients/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push(`/dashboard/clients/${resolvedParams.id}`)
      }
    } catch (error) {
      console.error('Error updating client:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: keyof Client, value: string | boolean) => {
    if (formData) {
      setFormData({ ...formData, [field]: value })
    }
  }

  if (loading || !formData) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${resolvedParams.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-secondary-900">Edit Client</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Client Type"
                options={[
                  { value: 'INDIVIDUAL', label: 'Individual' },
                  { value: 'BUSINESS', label: 'Business' },
                ]}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              />
              <Select
                label="Status"
                options={[
                  { value: 'PROSPECT', label: 'Prospect' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'ARCHIVED', label: 'Archived' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
            </div>

            {formData.type === 'INDIVIDUAL' ? (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName || ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
                <Input
                  label="SSN"
                  value={formData.ssn || ''}
                  onChange={(e) => handleChange('ssn', e.target.value)}
                  placeholder="XXX-XX-XXXX"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Business Name"
                  value={formData.businessName || ''}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
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
                      { value: 'TRUST', label: 'Trust' },
                      { value: 'ESTATE', label: 'Estate' },
                    ]}
                    value={formData.entityType || ''}
                    onChange={(e) => handleChange('entityType', e.target.value)}
                  />
                  <Input
                    label="EIN"
                    value={formData.ein || ''}
                    onChange={(e) => handleChange('ein', e.target.value)}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              <Input
                label="Phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
              <Input
                label="Mobile Phone"
                value={formData.mobilePhone || ''}
                onChange={(e) => handleChange('mobilePhone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Address Line 1"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
            />
            <Input
              label="Address Line 2"
              value={formData.address2 || ''}
              onChange={(e) => handleChange('address2', e.target.value)}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              />
              <Input
                label="State"
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
              />
              <Input
                label="Zip Code"
                value={formData.zipCode || ''}
                onChange={(e) => handleChange('zipCode', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Info */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Billing Email"
              type="email"
              value={formData.billingEmail || ''}
              onChange={(e) => handleChange('billingEmail', e.target.value)}
            />
            <Input
              label="Billing Address"
              value={formData.billingAddress || ''}
              onChange={(e) => handleChange('billingAddress', e.target.value)}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.billingCity || ''}
                onChange={(e) => handleChange('billingCity', e.target.value)}
              />
              <Input
                label="State"
                value={formData.billingState || ''}
                onChange={(e) => handleChange('billingState', e.target.value)}
              />
              <Input
                label="Zip Code"
                value={formData.billingZipCode || ''}
                onChange={(e) => handleChange('billingZipCode', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Portal Settings */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Client Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.portalEnabled}
                onChange={(e) => handleChange('portalEnabled', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Enable Client Portal Access</span>
            </label>
            {formData.portalEnabled && (
              <Input
                label="Portal Email"
                type="email"
                value={formData.portalEmail || ''}
                onChange={(e) => handleChange('portalEmail', e.target.value)}
                helperText="Email address for portal login"
              />
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/clients/${resolvedParams.id}`}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" loading={submitting}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
