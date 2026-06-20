import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { DEFAULT_PAGE_SIZE, extractPaginatedResponse } from '../lib/pagination'
import { formatMoney, getErrorMessage, canCreateProducts } from '../lib/format'
import {
  DEFAULT_MEASUREMENT_UNITS,
  defaultMeasurementUnit,
  normalizeProductUnit,
} from '../constants/measurementUnits'
import type { ApiResponse, PaginatedMeta, Product } from '../types/api'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Select,
} from '../components/ui'
import { ImportButton, ImportModal } from '../components/ImportModal'

const emptyForm = {
  name: '',
  unit: defaultMeasurementUnit(),
  cost_price: '',
  sale_price: '',
  is_active: true,
}

export function ProductsPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const canManage = canCreateProducts(user, !!tenant)

  async function loadProducts(nextPage = page, query = search) {
    setLoading(true)
    setError('')

    try {
      const params: Record<string, string | number> = { page: nextPage, per_page: DEFAULT_PAGE_SIZE }
      if (query) params.q = query

      const response = await api.get('/products', { params })
      const { items, meta: nextMeta } = extractPaginatedResponse<Product>(response.data)
      setProducts(items)
      setMeta(nextMeta)
      setPage(nextMeta?.current_page ?? nextPage)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts(1)
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      name: product.name,
      unit: normalizeProductUnit(product.unit),
      cost_price: product.cost_price,
      sale_price: product.sale_price,
      is_active: product.is_active,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload = {
      name: form.name,
      unit: form.unit,
      cost_price: Number(form.cost_price),
      sale_price: Number(form.sale_price),
      is_active: form.is_active,
    }

    try {
      if (editing) {
        await api.patch<ApiResponse<Product>>(`/products/${editing.id}`, payload)
        setSuccess('Producto actualizado.')
      } else {
        await api.post<ApiResponse<Product>>('/products', payload)
        setSuccess('Producto creado.')
      }

      setModalOpen(false)
      await loadProducts(page)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`¿Eliminar ${product.name}?`)) return

    try {
      await api.delete(`/products/${product.id}`)
      setSuccess('Producto eliminado.')
      await loadProducts(page)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle="Catálogo de productos y precios"
        action={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <ImportButton label="Carga masiva" onClick={() => setImportOpen(true)} />
              <Button onClick={() => openCreate()}>
                <Plus className="h-4 w-4" />
                Nuevo producto
              </Button>
            </div>
          ) : undefined
        }
      />

      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <Card className="mb-4">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            loadProducts(1, search)
          }}
        >
          <Input
            label="Buscar"
            placeholder="Nombre del producto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" className="self-end">
            Buscar
          </Button>
        </form>
      </Card>

      <Card>
        {loading && products.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState message="No hay productos registrados." />
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4">Producto</th>
                    <th className="py-2 pr-4">Unidad</th>
                    <th className="py-2 pr-4">Costo</th>
                    <th className="py-2 pr-4">Venta</th>
                    <th className="py-2 pr-4">Estado</th>
                    {canManage && <th className="py-2">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium">{product.name}</td>
                      <td className="py-3 pr-4">{product.unit}</td>
                      <td className="py-3 pr-4">{formatMoney(product.cost_price)}</td>
                      <td className="py-3 pr-4">{formatMoney(product.sale_price)}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={product.is_active ? 'success' : 'danger'}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      {canManage && (
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
        <Pagination meta={meta} loading={loading} onPageChange={(nextPage) => loadProducts(nextPage)} />
      </Card>

      {modalOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Select
                label="Unidad de medida"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: normalizeProductUnit(e.target.value) })}
                required
              >
                {DEFAULT_MEASUREMENT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    label="Precio costo (COP)"
                    type="number"
                    min="0"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                    required
                  />
                  {form.cost_price && (
                    <p className="mt-1 text-xs text-slate-500">{formatMoney(form.cost_price)}</p>
                  )}
                </div>
                <div>
                  <Input
                    label="Precio venta (COP)"
                    type="number"
                    min="0"
                    value={form.sale_price}
                    onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                    required
                  />
                  {form.sale_price && (
                    <p className="mt-1 text-xs text-slate-500">{formatMoney(form.sale_price)}</p>
                  )}
                </div>
              </div>
              <Select
                label="Estado"
                value={form.is_active ? '1' : '0'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </Select>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  Guardar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {importOpen && canManage && (
        <ImportModal
          title="Importar productos"
          templatePath="/products/import/template"
          templateFilename="plantilla-productos.xlsx"
          importPath="/products/import"
          onCompleted={() => loadProducts(page)}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  )
}
