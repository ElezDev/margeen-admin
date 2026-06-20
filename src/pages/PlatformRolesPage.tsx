import { useEffect, useState } from 'react'
import { Plus, Trash2, Shield, KeyRound } from 'lucide-react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/format'
import type { Permission, Role } from '../types/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from '../components/ui'

export function PlatformRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissionName, setPermissionName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get<{ data: Role[] }>('/platform/roles'),
        api.get<{ data: Permission[] }>('/platform/permissions'),
      ])
      setRoles(rolesRes.data.data)
      setPermissions(permissionsRes.data.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreateRole() {
    setEditingRole(null)
    setRoleName('')
    setSelectedPermissions([])
    setRoleModalOpen(true)
  }

  function openEditRole(role: Role) {
    setEditingRole(role)
    setRoleName(role.name)
    setSelectedPermissions(role.permissions)
    setRoleModalOpen(true)
  }

  function togglePermission(name: string) {
    setSelectedPermissions((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    )
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingRole) {
        await api.patch(`/platform/roles/${editingRole.id}`, {
          permissions: selectedPermissions,
          ...(editingRole.is_system ? {} : { name: roleName }),
        })
        setSuccess('Rol actualizado.')
      } else {
        await api.post('/platform/roles', {
          name: roleName,
          permissions: selectedPermissions,
        })
        setSuccess('Rol creado.')
      }

      setRoleModalOpen(false)
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteRole(role: Role) {
    if (!confirm(`¿Eliminar el rol ${role.name}?`)) return

    try {
      await api.delete(`/platform/roles/${role.id}`)
      setSuccess('Rol eliminado.')
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleCreatePermission(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await api.post('/platform/permissions', { name: permissionName })
      setSuccess('Permiso creado.')
      setPermissionName('')
      setPermissionModalOpen(false)
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePermission(permission: Permission) {
    if (!confirm(`¿Eliminar el permiso ${permission.name}?`)) return

    try {
      await api.delete(`/platform/permissions/${permission.id}`)
      setSuccess('Permiso eliminado.')
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles y permisos"
        subtitle="Define qué puede hacer cada tipo de usuario en Margeen"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPermissionModalOpen(true)}>
              <KeyRound className="h-4 w-4" />
              Nuevo permiso
            </Button>
            <Button onClick={openCreateRole}>
              <Plus className="h-4 w-4" />
              Nuevo rol
            </Button>
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold">Roles</h2>
            </div>
            {roles.length === 0 ? (
              <EmptyState message="No hay roles." />
            ) : (
              <div className="space-y-3">
                {roles.map((role) => (
                  <div key={role.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{role.name.replace('_', ' ')}</p>
                          {role.is_system && <Badge>Sistema</Badge>}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {role.permissions.length} permisos
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {role.name !== 'super_admin' && (
                          <button
                            type="button"
                            onClick={() => openEditRole(role)}
                            className="text-sm text-brand-600 hover:underline"
                          >
                            Editar
                          </button>
                        )}
                        {!role.is_system && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {role.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold">Permisos</h2>
            </div>
            {permissions.length === 0 ? (
              <EmptyState message="No hay permisos." />
            ) : (
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <span className="text-sm">{permission.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeletePermission(permission)}
                      className="rounded p-1 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold">
              {editingRole ? 'Editar rol' : 'Nuevo rol'}
            </h2>
            <form className="space-y-4" onSubmit={handleSaveRole}>
              <Input
                label="Nombre del rol"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="ej: cajero"
                disabled={!!editingRole?.is_system}
                required={!editingRole?.is_system}
              />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Permisos</p>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.name)}
                        onChange={() => togglePermission(permission.name)}
                      />
                      {permission.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setRoleModalOpen(false)}>
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

      {permissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <h2 className="mb-4 text-lg font-semibold">Nuevo permiso</h2>
            <form className="space-y-4" onSubmit={handleCreatePermission}>
              <Input
                label="Nombre"
                value={permissionName}
                onChange={(e) => setPermissionName(e.target.value)}
                placeholder="ej: inventory.view"
                required
              />
              <p className="text-xs text-slate-500">
                Usa minúsculas y puntos, por ejemplo: `reports.export`
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setPermissionModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  Crear
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
