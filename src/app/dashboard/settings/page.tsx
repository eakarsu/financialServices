'use client'

import { useState, useEffect } from 'react'
import { Save, Building, User, Bell, Shield, CreditCard } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [firmData, setFirmData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
  })
  const [billingData, setBillingData] = useState({
    defaultHourlyRate: '150',
    invoicePrefix: 'INV',
    defaultPaymentTerms: '30',
    fiscalYearStart: '1',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setProfileData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
        })
        if (data.user.firm) {
          setFirmData({
            name: data.user.firm.name || '',
            email: data.user.firm.email || '',
            phone: data.user.firm.phone || '',
            address: data.user.firm.address || '',
            city: data.user.firm.city || '',
            state: data.user.firm.state || '',
            zipCode: data.user.firm.zipCode || '',
            website: data.user.firm.website || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    // Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
  }

  const handleSaveFirm = async () => {
    setSaving(true)
    // Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
  }

  const handleSaveBilling = async () => {
    setSaving(true)
    // Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-600">Manage your account and firm settings</p>
      </div>

      <Card variant="bordered">
        <Tabs defaultValue="profile">
          <TabsList className="px-4 pt-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="firm">
              <Building className="h-4 w-4 mr-2" />
              Firm
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="p-6">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                    <Input
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                  <Input
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} loading={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="firm" className="p-6">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Firm Information</h3>
                <div className="space-y-4">
                  <Input
                    label="Firm Name"
                    value={firmData.name}
                    onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      value={firmData.email}
                      onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                    />
                    <Input
                      label="Phone"
                      value={firmData.phone}
                      onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Website"
                    value={firmData.website}
                    onChange={(e) => setFirmData({ ...firmData, website: e.target.value })}
                    placeholder="https://www.yourfirm.com"
                  />
                  <Input
                    label="Address"
                    value={firmData.address}
                    onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="City"
                      value={firmData.city}
                      onChange={(e) => setFirmData({ ...firmData, city: e.target.value })}
                    />
                    <Input
                      label="State"
                      value={firmData.state}
                      onChange={(e) => setFirmData({ ...firmData, state: e.target.value })}
                    />
                    <Input
                      label="Zip Code"
                      value={firmData.zipCode}
                      onChange={(e) => setFirmData({ ...firmData, zipCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveFirm} loading={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="p-6">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Billing Settings</h3>
                <div className="space-y-4">
                  <Input
                    label="Default Hourly Rate"
                    type="number"
                    value={billingData.defaultHourlyRate}
                    onChange={(e) => setBillingData({ ...billingData, defaultHourlyRate: e.target.value })}
                    helperText="This rate will be used as default for new time entries"
                  />
                  <Input
                    label="Invoice Number Prefix"
                    value={billingData.invoicePrefix}
                    onChange={(e) => setBillingData({ ...billingData, invoicePrefix: e.target.value })}
                    helperText="Invoices will be numbered as INV-00001, INV-00002, etc."
                  />
                  <Select
                    label="Default Payment Terms"
                    options={[
                      { value: '15', label: 'Net 15' },
                      { value: '30', label: 'Net 30' },
                      { value: '45', label: 'Net 45' },
                      { value: '60', label: 'Net 60' },
                    ]}
                    value={billingData.defaultPaymentTerms}
                    onChange={(e) => setBillingData({ ...billingData, defaultPaymentTerms: e.target.value })}
                  />
                  <Select
                    label="Fiscal Year Start Month"
                    options={[
                      { value: '1', label: 'January' },
                      { value: '4', label: 'April' },
                      { value: '7', label: 'July' },
                      { value: '10', label: 'October' },
                    ]}
                    value={billingData.fiscalYearStart}
                    onChange={(e) => setBillingData({ ...billingData, fiscalYearStart: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBilling} loading={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="p-6">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { id: 'email_invoices', label: 'Invoice notifications', description: 'Receive emails when invoices are paid or overdue' },
                    { id: 'email_deadlines', label: 'Deadline reminders', description: 'Get notified about upcoming tax deadlines' },
                    { id: 'email_tasks', label: 'Task assignments', description: 'Receive notifications when tasks are assigned to you' },
                    { id: 'email_documents', label: 'Document uploads', description: 'Get notified when clients upload documents' },
                  ].map(pref => (
                    <label key={pref.id} className="flex items-start p-4 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100">
                      <input type="checkbox" defaultChecked className="mt-1 rounded" />
                      <div className="ml-3">
                        <p className="font-medium text-secondary-900">{pref.label}</p>
                        <p className="text-sm text-secondary-500">{pref.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="p-6">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-secondary-500">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="secondary">Enable 2FA</Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-secondary-500">This device • Active now</p>
                    </div>
                    <Button variant="ghost" className="text-red-600">Sign Out</Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
