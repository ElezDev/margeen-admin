import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { DEFAULT_PAGE_SIZE, extractPaginatedResponse } from '../lib/pagination'
import {
  canCreateClients,
  canManageTenantCatalog,
  getErrorMessage,
  hasPermission,
} from '../lib/format'
import type { ApiResponse, Client, PaginatedMeta } from '../types/api'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Textarea,
} from '../components/ui'
import { ImportButton, ImportModal } from '../components/ImportModal'

const emptyForm = {
  name: '',
  document: '',
  phone: '',
  address: '',
  notes: '',
}

export function ClientsPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const [clients, setClients] = useState<Client[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const canUpdate = hasPermission(user, 'clients.update') || canManageTenantCatalog(user, !!tenant)
  const canDelete = hasPermission(user, 'clients.delete') || canManageTenantCatalog(user, !!tenant)
  const canImport = canCreateClients(user, !!tenant)

  async function loadClients(nextPage = page, query = search) {
    setLoading(true)
    setError('')

    try {
      const params: Record<string, string | number> = { page: nextPage, per_page: DEFAULT_PAGE_SIZE }
      if (query) params.q = query

      const response = await api.get('/clients', { params })
      const { items, meta: nextMeta } = extractPaginatedResponse<Client>(response.data)
      setClients(items)
      setMeta(nextMeta)
      setPage(nextMeta?.current_page ?? nextPage)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients(1)
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setForm({
      name: client.name,
      document: client.document || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editing) {
        await api.patch<ApiResponse<Client>>(`/clients/${editing.id}`, form)
        setSuccess('Cliente actualizado.')
      } else {
        await api.post<ApiResponse<Client>>('/clients', form)
        setSuccess('Cliente creado.')
      }

      setModalOpen(false)
      await loadClients(page)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(client: Client) {
    if (!confirm(`¿Eliminar a ${client.name}?`)) return

    setError('')
    setSuccess('')

    try {
      await api.delete(`/clients/${client.id}`)
      setSuccess('Cliente eliminado.')
      await loadClients(page)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Administra tu cartera de clientes"
        action={
          canImport ? (
            <div className="flex flex-wrap gap-2">
              <ImportButton label="Carga masiva" onClick={() => setImportOpen(true)} />
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </Button>
            </div>
          ) : (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Button>
          )
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
            loadClients(1, search)
          }}
        >
          <Input
            label="Buscar"
            placeholder="Nombre, documento o teléfono"
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
        {loading && clients.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState message="No hay clientes registrados." />
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Teléfono</th>
                  <th className="py-2 pr-4">Dirección</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{client.name}</td>
                    <td className="py-3 pr-4">{client.document || '—'}</td>
                    <td className="py-3 pr-4">{client.phone || '—'}</td>
                    <td className="py-3 pr-4">{client.address || '—'}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => openEdit(client)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(client)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} loading={loading} onPageChange={(nextPage) => loadClients(nextPage)} />
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {editing ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Documento"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
              />
              <Input
                label="Teléfono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Dirección"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <Textarea
                label="Notas"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
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

      {importOpen && canImport && (
        <ImportModal
          title="Importar clientes"
          templatePath="/clients/import/template"
          templateFilename="plantilla-clientes.xlsx"
          importPath="/clients/import"
          onCompleted={() => loadClients(page)}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  )
}
