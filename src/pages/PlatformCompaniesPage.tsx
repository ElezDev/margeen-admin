import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Pencil, ImagePlus, Trash2, Settings2 } from 'lucide-react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/format'
import type { ApiResponse, Company } from '../types/api'
import { useTenant } from '../context/TenantContext'
import { CompanyLogoPreview } from '../components/CompanyLogoPreview'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'

const emptyForm = {
  name: '',
  document: '',
  phone: '',
  address: '',
  notes: '',
  is_active: true,
  default_margin_percent: '25',
  invoice_prefix: 'FAC',
  next_invoice_number: '1',
  admin_name: '',
  admin_email: '',
  admin_password: '',
}

export function PlatformCompaniesPage() {
  const navigate = useNavigate()
  const { selectTenant } = useTenant()
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadCompanies(query = search) {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get<{ data: Company[] }>('/platform/companies', {
        params: query ? { q: query } : {},
      })
      setCompanies(data.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setLogoFile(null)
    setModalOpen(true)
  }

  function openEdit(company: Company) {
    setEditing(company)
    setForm({
      name: company.name,
      document: company.document || '',
      phone: company.phone || '',
      address: company.address || '',
      notes: company.notes || '',
      is_active: company.is_active ?? true,
      default_margin_percent: company.default_margin_percent,
      invoice_prefix: company.invoice_prefix,
      next_invoice_number: String(company.next_invoice_number),
      admin_name: '',
      admin_email: '',
      admin_password: '',
    })
    setLogoFile(null)
    setModalOpen(true)
  }

  async function uploadLogo(companyId: number) {
    if (!logoFile) return

    const formData = new FormData()
    formData.append('logo', logoFile)

    await api.post(`/platform/companies/${companyId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload: Record<string, unknown> = {
      name: form.name,
      document: form.document || null,
      phone: form.phone || null,
      address: form.address || null,
      notes: form.notes || null,
      is_active: form.is_active,
      default_margin_percent: Number(form.default_margin_percent),
      invoice_prefix: form.invoice_prefix,
    }

    try {
      if (editing) {
        payload.next_invoice_number = Number(form.next_invoice_number)
        await api.patch<ApiResponse<Company>>(`/platform/companies/${editing.id}`, payload)
        if (logoFile) await uploadLogo(editing.id)
        setSuccess('Empresa actualizada.')
      } else {
        if (form.admin_name && form.admin_email && form.admin_password) {
          payload.admin_name = form.admin_name
          payload.admin_email = form.admin_email
          payload.admin_password = form.admin_password
        }

        const { data } = await api.post<ApiResponse<Company>>('/platform/companies', payload)
        if (logoFile) await uploadLogo(data.data.id)
        setSuccess('Empresa creada.')
      }

      setModalOpen(false)
      await loadCompanies()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteLogo(company: Company) {
    if (!confirm(`¿Eliminar el logo de ${company.name}?`)) return

    try {
      await api.delete(`/platform/companies/${company.id}/logo`)
      setSuccess('Logo eliminado.')
      await loadCompanies()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Empresas"
        subtitle="Gestiona los clientes de la plataforma Margeen"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva empresa
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <Card className="mb-4">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            loadCompanies(search)
          }}
        >
          <Input
            label="Buscar"
            placeholder="Nombre, NIT o teléfono"
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
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
          </div>
        ) : companies.length === 0 ? (
          <EmptyState message="No hay empresas registradas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Empresa</th>
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Usuarios</th>
                  <th className="py-2 pr-4">Facturas</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <CompanyLogoPreview
                          logoUrl={company.logo_url}
                          logoPath={company.logo_path}
                          hasLogo={!!company.logo_path}
                        />
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-slate-500">{company.phone || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{company.document || '—'}</td>
                    <td className="py-3 pr-4">{company.users_count ?? 0}</td>
                    <td className="py-3 pr-4">{company.invoices_count ?? 0}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={company.is_active ? 'success' : 'danger'}>
                        {company.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5"
                          onClick={() => {
                            selectTenant(company)
                            navigate('/dashboard')
                          }}
                        >
                          <Settings2 className="h-4 w-4" />
                          Gestionar
                        </Button>
                        <button
                          type="button"
                          onClick={() => openEdit(company)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {company.logo_path && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLogo(company)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            title="Quitar logo"
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
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <div className="mb-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold">
                {editing ? 'Editar empresa' : 'Nueva empresa'}
              </h2>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Nombre comercial"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="NIT / Documento"
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                />
                <Input
                  label="Teléfono"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Prefijo factura"
                  value={form.invoice_prefix}
                  onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                  required
                />
                <Input
                  label="Margen default (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={form.default_margin_percent}
                  onChange={(e) => setForm({ ...form, default_margin_percent: e.target.value })}
                />
                {editing && (
                  <Input
                    label="Próximo número factura"
                    type="number"
                    min="1"
                    value={form.next_invoice_number}
                    onChange={(e) => setForm({ ...form, next_invoice_number: e.target.value })}
                  />
                )}
                <Select
                  label="Estado"
                  value={form.is_active ? '1' : '0'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}
                >
                  <option value="1">Activa</option>
                  <option value="0">Inactiva</option>
                </Select>
              </div>

              <Input
                label="Dirección"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              <Textarea
                label="Notas internas (solo plataforma)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Plan contratado, contacto principal, observaciones..."
              />

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Logo</span>
                <div className="flex flex-wrap items-center gap-4">
                  {editing && (
                    <CompanyLogoPreview
                      logoUrl={editing.logo_url}
                      logoPath={editing.logo_path}
                      hasLogo={!!editing.logo_path}
                    />
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
                    <ImagePlus className="h-4 w-4" />
                    {logoFile ? logoFile.name : 'Subir imagen (PNG, JPG, WEBP)'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </label>

              {!editing && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-700">
                    Admin inicial (opcional)
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Nombre admin"
                      value={form.admin_name}
                      onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                    />
                    <Input
                      label="Correo admin"
                      type="email"
                      value={form.admin_email}
                      onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                    />
                    <Input
                      label="Contraseña admin"
                      type="password"
                      value={form.admin_password}
                      onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                      className="md:col-span-2"
                    />
                  </div>
                </div>
              )}

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
    </div>
  )
}
