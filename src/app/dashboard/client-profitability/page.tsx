async function getClientProfitability() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/analytics/client-profitability`, { cache: 'no-store' })
  return res.json()
}

export default async function ClientProfitabilityPage() {
  const data = await getClientProfitability()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Client Profitability</h1>
        <p className="text-secondary-600">Realization, WIP, and pricing pressure across recurring financial-service clients.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Realization Rate" value={`${data.summary.realizationRate}%`} />
        <Metric label="Unbilled WIP" value={`$${data.summary.unbilledWip.toLocaleString()}`} />
        <Metric label="Low-Margin Clients" value={data.summary.lowMarginClients} />
        <Metric label="Pricing Actions" value={data.summary.pricingActions} />
      </div>
      <div className="rounded-lg border border-secondary-200 bg-white overflow-hidden">
        {data.clients.map((client: any) => (
          <div key={client.name} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-secondary-100">
            <strong>{client.name}</strong><span>${client.revenue.toLocaleString()}</span><span>{client.margin}% margin</span><span>{client.issue}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-secondary-200 bg-white p-4">
        <h2 className="font-semibold text-secondary-900">Actions</h2>
        <ul className="mt-3 list-disc pl-5 text-secondary-700">{data.actions.map((action: string) => <li key={action}>{action}</li>)}</ul>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-secondary-200 bg-white p-4"><div className="text-sm text-secondary-500">{label}</div><div className="text-xl font-semibold text-secondary-900">{value}</div></div>
}
