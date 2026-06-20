import { useEffect, useState } from 'react'
import { Plus, Pencil, UserX } from 'lucide-react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/format'
import type { ApiResponse, User } from '../types/api'
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
  email: '',
  password: '',
  document: '',
  phone: '',
  address: '',
  notes: '',
  role: 'vendedor',
  is_active: true,
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get<{ data: User[] }>('/users')
      setUsers(data.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      document: user.document || '',
      phone: user.phone || '',
      address: user.address || '',
      notes: user.notes || '',
      role: user.roles[0] || 'vendedor',
      is_active: user.is_active,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      document: form.document,
      phone: form.phone,
      address: form.address,
      notes: form.notes,
      role: form.role,
      is_active: form.is_active,
    }

    if (form.password) payload.password = form.password

    try {
      if (editing) {
        await api.patch<ApiResponse<User>>(`/users/${editing.id}`, payload)
        setSuccess('Usuario actualizado.')
      } else {
        await api.post<ApiResponse<User>>('/users', payload)
        setSuccess('Usuario creado.')
      }

      setModalOpen(false)
      await loadUsers()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(user: User) {
    if (!confirm(`¿Desactivar a ${user.name}?`)) return

    try {
      await api.delete(`/users/${user.id}`)
      setSuccess('Usuario desactivado.')
      await loadUsers()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Administra vendedores y accesos"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState message="No hay usuarios registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Correo</th>
                  <th className="py-2 pr-4">Rol</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{user.name}</td>
                    <td className="py-3 pr-4">{user.email}</td>
                    <td className="py-3 pr-4 capitalize">{user.roles[0] || '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user.is_active && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(user)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          >
                            <UserX className="h-4 w-4" />
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
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold">
              {editing ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Correo"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label={editing ? 'Contraseña (opcional)' : 'Contraseña'}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
              />
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
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
              <Select
                label="Rol"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="vendedor">Vendedor</option>
              </Select>
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
    </div>
  )
}
