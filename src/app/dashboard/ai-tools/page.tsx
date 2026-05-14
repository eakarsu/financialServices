'use client'

import { useState } from 'react'
import { Brain, TrendingUp, Repeat, FileText, Loader2 } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface CashFlowResult {
  forecast: { weekStart: string; inflow: number; outflow: number; net: number; runningBalance: number }[]
  narrative: string
  risks: string[]
  opportunities: string[]
  _meta?: { model: string; processingTime: number }
}

interface ReconResult {
  matches: {
    bankTxId: string
    candidates: { journalLineId: string; confidence: number; reason: string }[]
  }[]
  counts: { bankTxns: number; candidates: number; suggestions: number }
}

interface Packet1099 {
  contractorId: string
  name: string
  totalPaid: number
  taxYear: number
  formType: string
  notes: string[]
}

export default function AIToolsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cash, setCash] = useState<CashFlowResult | null>(null)
  const [recon, setRecon] = useState<ReconResult | null>(null)
  const [packets, setPackets] = useState<{ contractors: Packet1099[]; taxYear: number; generated: number } | null>(null)

  async function call<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      throw new Error(j.message || j.error || `HTTP ${r.status}`)
    }
    return r.json()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-7 w-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold">Advanced AI Tools</h1>
          <p className="text-sm text-secondary-600">
            Cash-flow forecasting, reconciliation copilot, 1099 packet generator. All
            powered by Claude 3.5 Sonnet (rate-limited 20/hr/user).
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Cash-Flow Forecaster */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> 13-Week Cash-Flow Forecast
              </CardTitle>
              <CardDescription>
                Plaid history + outstanding invoices + AI narrative
              </CardDescription>
            </div>
            <Button
              disabled={loading !== null}
              onClick={async () => {
                setLoading('cash')
                setError(null)
                try {
                  const r = await call<CashFlowResult>('/api/ai/cash-flow-forecast', { weeks: 13 })
                  setCash(r)
                } catch (e) {
                  setError((e as Error).message)
                } finally {
                  setLoading(null)
                }
              }}
            >
              {loading === 'cash' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Forecast 13 weeks
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!cash && (
            <p className="text-sm text-secondary-500">
              Run a forecast to see weekly inflows/outflows and AI commentary.
            </p>
          )}
          {cash && (
            <div className="space-y-4">
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Week</th>
                      <th className="px-3 py-2 text-right">Inflow</th>
                      <th className="px-3 py-2 text-right">Outflow</th>
                      <th className="px-3 py-2 text-right">Net</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cash.forecast.map((w) => (
                      <tr key={w.weekStart} className="border-t">
                        <td className="px-3 py-2">{w.weekStart}</td>
                        <td className="px-3 py-2 text-right text-green-700">{formatCurrency(w.inflow)}</td>
                        <td className="px-3 py-2 text-right text-red-700">{formatCurrency(w.outflow)}</td>
                        <td className={`px-3 py-2 text-right ${w.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(w.net)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(w.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-sm">
                <p className="font-semibold mb-1">AI Narrative</p>
                <p className="text-secondary-700">{cash.narrative}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="font-semibold mb-1">Risks</p>
                  <ul className="list-disc pl-5 text-sm text-secondary-700">
                    {cash.risks.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Opportunities</p>
                  <ul className="list-disc pl-5 text-sm text-secondary-700">
                    {cash.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation Copilot */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" /> Reconciliation Copilot
              </CardTitle>
              <CardDescription>AI-suggested matches between bank feed & journal entries</CardDescription>
            </div>
            <Button
              disabled={loading !== null}
              onClick={async () => {
                setLoading('recon')
                setError(null)
                try {
                  const r = await call<ReconResult>('/api/ai/reconciliation-copilot', { limit: 20 })
                  setRecon(r)
                } catch (e) {
                  setError((e as Error).message)
                } finally {
                  setLoading(null)
                }
              }}
            >
              {loading === 'recon' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Repeat className="h-4 w-4 mr-2" />
              )}
              Suggest matches
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!recon && (
            <p className="text-sm text-secondary-500">
              Click "Suggest matches" to have AI rank candidate journal lines against
              unreconciled bank transactions.
            </p>
          )}
          {recon && (
            <div className="space-y-3">
              <div className="text-xs text-secondary-500 flex gap-4">
                <span>Bank txns: {recon.counts.bankTxns}</span>
                <span>Candidates: {recon.counts.candidates}</span>
                <span>Suggestions: {recon.counts.suggestions}</span>
              </div>
              {recon.matches.map((m) => (
                <div key={m.bankTxId} className="border rounded-lg p-3 text-sm">
                  <p className="font-mono text-xs text-secondary-500">Bank TX: {m.bankTxId}</p>
                  <ul className="mt-1 space-y-1">
                    {m.candidates.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge variant={c.confidence >= 0.85 ? 'success' : c.confidence >= 0.6 ? 'warning' : 'info'} size="sm">
                          {Math.round(c.confidence * 100)}%
                        </Badge>
                        <span>
                          <span className="font-mono text-xs">{c.journalLineId}</span> — {c.reason}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1099 Packet Generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> 1099-NEC Packet Generator
              </CardTitle>
              <CardDescription>Pulls contractor payments, drafts box-mapped 1099-NECs ($600+ threshold)</CardDescription>
            </div>
            <Button
              disabled={loading !== null}
              onClick={async () => {
                setLoading('1099')
                setError(null)
                try {
                  const r = await call<{ contractors: Packet1099[]; taxYear: number; generated: number }>(
                    '/api/ai/contractor-1099',
                    { taxYear: new Date().getFullYear() - 1 }
                  )
                  setPackets(r)
                } catch (e) {
                  setError((e as Error).message)
                } finally {
                  setLoading(null)
                }
              }}
            >
              {loading === '1099' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate 1099 packets
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!packets && (
            <p className="text-sm text-secondary-500">
              Generates draft 1099-NEC forms for all contractors paid $600 or more in
              the prior tax year.
            </p>
          )}
          {packets && (
            <div className="space-y-2">
              <p className="text-xs text-secondary-500">
                Tax year {packets.taxYear} — {packets.generated} contractor(s) over threshold
              </p>
              {packets.contractors.map((c) => (
                <div key={c.contractorId} className="border rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{c.name}</p>
                    <Badge variant="info">{c.formType}</Badge>
                  </div>
                  <p className="text-secondary-600">Total paid: {formatCurrency(c.totalPaid)}</p>
                  {c.notes.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-xs text-secondary-500">
                      {c.notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
