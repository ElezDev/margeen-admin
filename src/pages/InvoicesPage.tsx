import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, formatMoney, getErrorMessage } from '../lib/format'
import { DEFAULT_PAGE_SIZE, extractPaginatedResponse } from '../lib/pagination'
import type { Invoice, PaginatedMeta } from '../types/api'
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Pagination, Select } from '../components/ui'

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadInvoices(nextPage = page) {
    setLoading(true)
    setError('')

    try {
      const params: Record<string, string | number> = { page: nextPage, per_page: DEFAULT_PAGE_SIZE }
      if (status) params.status = status

      const response = await api.get('/invoices', { params })
      const { items, meta: nextMeta } = extractPaginatedResponse<Invoice>(response.data)
      setInvoices(items)
      setMeta(nextMeta)
      setPage(nextMeta?.current_page ?? nextPage)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    loadInvoices(1)
  }, [status])

  return (
    <div>
      <PageHeader
        title="Facturas"
        subtitle="Historial de facturas emitidas"
        action={
          <Link to="/invoices/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva factura
            </Button>
          </Link>
        }
      />

      {error && <Alert>{error}</Alert>}

      <Card className="mb-4">
        <Select
          label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="max-w-xs"
        >
          <option value="">Todas</option>
          <option value="issued">Emitidas</option>
          <option value="cancelled">Canceladas</option>
        </Select>
      </Card>

      <Card>
        {loading && invoices.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState message="No hay facturas registradas." />
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4">Número</th>
                    <th className="py-2 pr-4">Cliente</th>
                    <th className="py-2 pr-4">Vendedor</th>
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Ganancia</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4">
                        <Link to={`/invoices/${invoice.id}`} className="font-medium text-brand-600 hover:underline">
                          {invoice.number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">{invoice.client?.name || '—'}</td>
                      <td className="py-3 pr-4">{invoice.seller?.name || '—'}</td>
                      <td className="py-3 pr-4">{formatDate(invoice.issued_at)}</td>
                      <td className="py-3 pr-4">{formatMoney(invoice.total)}</td>
                      <td className="py-3 pr-4 text-green-600">{formatMoney(invoice.total_profit)}</td>
                      <td className="py-3">
                        <Badge tone={invoice.status === 'issued' ? 'success' : 'danger'}>
                          {invoice.status === 'issued' ? 'Emitida' : 'Cancelada'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} loading={loading} onPageChange={(nextPage) => loadInvoices(nextPage)} />
      </Card>
    </div>
  )
}
