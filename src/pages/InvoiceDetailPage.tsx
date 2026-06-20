import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Download } from 'lucide-react'
import { api, downloadPdf } from '../lib/api'
import { formatDate, formatMoney, formatQuantity, getErrorMessage, hasPermission } from '../lib/format'
import type { ApiResponse, Invoice } from '../types/api'
import { useAuth } from '../context/AuthContext'
import { Alert, Badge, Button, Card, PageHeader } from '../components/ui'

export function InvoiceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const canCancel = hasPermission(user, 'invoices.cancel')

  async function loadInvoice() {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`)
      setInvoice(data.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoice()
  }, [id])

  async function handleCancel() {
    if (!invoice || !confirm(`¿Cancelar la factura ${invoice.number}?`)) return

    setError('')
    setSuccess('')

    try {
      const { data } = await api.patch<ApiResponse<Invoice>>(`/invoices/${invoice.id}/cancel`)
      setInvoice(data.data)
      setSuccess('Factura cancelada.')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleDownload() {
    if (!invoice) return

    try {
      await downloadPdf(invoice.id, invoice.number)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
      </div>
    )
  }

  if (!invoice) {
    return <Alert>No se encontró la factura.</Alert>
  }

  return (
    <div>
      <PageHeader
        title={`Factura ${invoice.number}`}
        subtitle={`Emitida el ${formatDate(invoice.issued_at)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/invoices">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <Button variant="secondary" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              PDF
            </Button>
            {canCancel && invoice.status === 'issued' && (
              <Button variant="danger" onClick={handleCancel}>
                <Ban className="h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Detalle</h2>
            <Badge tone={invoice.status === 'issued' ? 'success' : 'danger'}>
              {invoice.status === 'issued' ? 'Emitida' : 'Cancelada'}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Descripción</th>
                  <th className="py-2 pr-4">Cant.</th>
                  <th className="py-2 pr-4">Precio</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">{item.description}</td>
                    <td className="py-3 pr-4">
                      {formatQuantity(item.quantity)} {item.unit}
                    </td>
                    <td className="py-3 pr-4">{formatMoney(item.unit_price)}</td>
                    <td className="py-3">{formatMoney(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Cliente</h2>
            <p className="font-medium">{invoice.client?.name}</p>
            <p className="text-sm text-slate-500">{invoice.client?.phone || '—'}</p>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Totales</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatMoney(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Descuento</span>
                <span>{formatMoney(invoice.discount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Ganancia</span>
                <span>{formatMoney(invoice.total_profit)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Margen</span>
                <span>{invoice.profit_margin_percent}%</span>
              </div>
            </div>
          </Card>

          {invoice.notes && (
            <Card>
              <h2 className="mb-2 text-lg font-semibold">Notas</h2>
              <p className="text-sm text-slate-600">{invoice.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
