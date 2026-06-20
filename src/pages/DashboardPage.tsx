import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCharts } from '../components/DashboardCharts'
import { Alert, Card, EmptyState, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { formatDateInput, formatMoney } from '../lib/format'
import type { ApiResponse, DashboardData } from '../types/api'

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadDashboard(nextFrom?: string, nextTo?: string) {
    setLoading(true)
    setError('')

    try {
      const params: Record<string, string> = {}
      if (nextFrom) params.from = nextFrom
      if (nextTo) params.to = nextTo

      const { data: response } = await api.get<ApiResponse<DashboardData>>('/reports/dashboard', { params })
      setData(response.data)
      setFrom(response.data.period.from)
      setTo(response.data.period.to)
    } catch {
      setError('No se pudo cargar el dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Gráficas de ventas, ganancia y actividad del periodo"
        action={
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              loadDashboard(from, to)
            }}
          >
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Desde</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Hasta</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Filtrar
            </button>
          </form>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        </div>
      )}

      {!loading && data && (
        <>
          <DashboardCharts data={data} />

          <Card className="mt-6">
            <h2 className="mb-4 text-lg font-semibold">Facturas recientes</h2>
            {data.recent_invoices.length === 0 ? (
              <EmptyState message="No hay facturas recientes." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-4">Número</th>
                      <th className="py-2 pr-4">Cliente</th>
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4">
                          <Link to={`/invoices/${invoice.id}`} className="font-medium text-brand-600 hover:underline">
                            {invoice.number}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">{invoice.client_name}</td>
                        <td className="py-3 pr-4">{formatDateInput(invoice.issued_at)}</td>
                        <td className="py-3 pr-4">{formatMoney(invoice.total)}</td>
                        <td className="py-3 text-green-600">{formatMoney(invoice.total_profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
