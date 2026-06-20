import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { DEFAULT_MEASUREMENT_UNITS, normalizeProductUnit } from '../constants/measurementUnits'
import { extractPaginatedResponse } from '../lib/pagination'
import { formatMoney, getErrorMessage, parseMoney } from '../lib/format'
import type { ApiResponse, Client, Invoice, InvoiceItemInput, Product } from '../types/api'
import { Alert, Button, Card, Input, PageHeader, Select, Textarea } from '../components/ui'

interface LineForm {
  product_id: string
  description: string
  quantity: string
  unit: string
  unit_price: string
  unit_cost: string
}

const emptyLine = (): LineForm => ({
  product_id: '',
  description: '',
  quantity: '1',
  unit: 'Unidad',
  unit_price: '',
  unit_cost: '',
})

export function InvoiceCreatePage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [clientId, setClientId] = useState('')
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineForm[]>([emptyLine()])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsRes, productsRes] = await Promise.all([
          api.get('/clients', { params: { per_page: 200 } }),
          api.get('/products', { params: { active_only: 1, per_page: 200 } }),
        ])
        setClients(extractPaginatedResponse<Client>(clientsRes.data).items)
        setProducts(extractPaginatedResponse<Product>(productsRes.data).items)
      } catch (err) {
        setError(getErrorMessage(err))
      }
    }

    loadData()
  }, [])

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const quantity = parseMoney(line.quantity)
        const unitPrice = parseMoney(line.unit_price)
        return sum + quantity * unitPrice
      }, 0),
    [lines],
  )

  const total = useMemo(() => Math.max(subtotal - parseMoney(discount), 0), [subtotal, discount])

  function updateLine(index: number, patch: Partial<LineForm>) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    )
  }

  function handleProductSelect(index: number, productId: string) {
    const product = products.find((item) => item.id === Number(productId))
    if (!product) {
      updateLine(index, { product_id: productId })
      return
    }

    updateLine(index, {
      product_id: productId,
      description: product.name,
      unit: normalizeProductUnit(product.unit),
      unit_price: product.sale_price,
      unit_cost: product.cost_price,
    })
  }

  function lineTotal(line: LineForm): number {
    return parseMoney(line.quantity) * parseMoney(line.unit_price)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const items: InvoiceItemInput[] = lines.map((line) => ({
      ...(line.product_id ? { product_id: Number(line.product_id) } : {}),
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      unit_price: Number(line.unit_price),
      unit_cost: Number(line.unit_cost),
    }))

    try {
      const { data } = await api.post<ApiResponse<Invoice>>('/invoices', {
        client_id: Number(clientId),
        discount: Number(discount),
        notes: notes || undefined,
        items,
      })

      navigate(`/invoices/${data.data.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Nueva factura"
        subtitle="Crea una factura con productos del catálogo o líneas manuales"
        action={
          <Link to="/invoices">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />

      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="grid gap-4 md:grid-cols-2">
          <Select
            label="Cliente"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="">Seleccionar cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <div>
            <Input
              label="Descuento (COP)"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
            {parseMoney(discount) > 0 && (
              <p className="mt-1 text-xs text-slate-500">{formatMoney(discount)}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Productos</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLines((current) => [...current, emptyLine()])}
            >
              <Plus className="h-4 w-4" />
              Agregar línea
            </Button>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">Línea {index + 1}</p>
                  <p className="text-sm font-semibold text-brand-600">
                    Total línea: {formatMoney(lineTotal(line))}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <Select
                    label="Producto"
                    value={line.product_id}
                    onChange={(e) => handleProductSelect(index, e.target.value)}
                  >
                    <option value="">Manual</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {formatMoney(product.sale_price)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Descripción"
                    value={line.description}
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                    required
                  />
                  <Input
                    label="Cantidad"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                    required
                  />
                  <Select
                    label="Unidad"
                    value={line.unit}
                    onChange={(e) => updateLine(index, { unit: e.target.value })}
                    required
                  >
                    {DEFAULT_MEASUREMENT_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                  <div>
                    <Input
                      label="Precio venta (COP)"
                      type="number"
                      min="0"
                      value={line.unit_price}
                      onChange={(e) => updateLine(index, { unit_price: e.target.value })}
                      required
                    />
                    {line.unit_price && (
                      <p className="mt-1 text-xs text-slate-500">{formatMoney(line.unit_price)} c/u</p>
                    )}
                  </div>
                  <Input
                    label="Precio costo (COP)"
                    type="number"
                    min="0"
                    value={line.unit_cost}
                    onChange={(e) => updateLine(index, { unit_cost: e.target.value })}
                    required
                  />
                </div>

                {lines.length > 1 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                      className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline"
                    >
                      <Trash2 className="h-4 w-4" />
                      Quitar línea
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 ml-auto w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">{formatMoney(subtotal)}</span>
            </div>
            {parseMoney(discount) > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Descuento</span>
                <span className="font-medium text-red-600">- {formatMoney(discount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-brand-700">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            Crear factura
          </Button>
        </div>
      </form>
    </div>
  )
}
