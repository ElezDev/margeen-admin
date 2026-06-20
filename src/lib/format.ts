export function formatMoney(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return '$ 0'

  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)

  return formatted.replace(/\u00a0/g, ' ')
}

export function formatMoneyCompact(value: string | number): string {
  const num = parseMoney(value)

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num).replace(/\u00a0/g, ' ')
}

export function formatQuantity(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return '0'

  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(value: string | null): string {
  if (!value) return '—'

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDateInput(value: string | null): string {
  if (!value) return '—'

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${value}T12:00:00`))
}

export function parseMoney(value: string | number): number {
  return typeof value === 'number' ? value : parseFloat(value) || 0
}

export function hasPermission(user: { permissions: string[] } | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false
}

export function hasRole(user: { roles: string[] } | null, role: string): boolean {
  return user?.roles.includes(role) ?? false
}

export function isSuperAdmin(user: { roles: string[] } | null): boolean {
  return hasRole(user, 'super_admin')
}

/** Super admin gestionando una empresa tiene acceso total al catálogo vía API (Gate bypass). */
export function canManageTenantCatalog(
  user: { roles: string[]; permissions: string[] } | null,
  tenantSelected: boolean,
): boolean {
  return isSuperAdmin(user) && tenantSelected
}

export function canCreateProducts(
  user: { roles: string[]; permissions: string[] } | null,
  tenantSelected = false,
): boolean {
  return hasPermission(user, 'products.create') || canManageTenantCatalog(user, tenantSelected)
}

export function canCreateClients(
  user: { roles: string[]; permissions: string[] } | null,
  tenantSelected = false,
): boolean {
  return hasPermission(user, 'clients.create') || canManageTenantCatalog(user, tenantSelected)
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
    if (response?.data?.message) return response.data.message
    if (response?.data?.errors) {
      const first = Object.values(response.data.errors)[0]
      if (first?.[0]) return first[0]
    }
  }

  if (error instanceof Error) return error.message

  return 'Ocurrió un error inesperado.'
}
