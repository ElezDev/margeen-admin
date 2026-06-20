import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Shield,
  Users,
  UserCircle,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { hasPermission, hasRole, isSuperAdmin } from '../lib/format'
import { Logo } from './Logo'
import { Alert, LoadingScreen } from './ui'

const businessNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Facturas', icon: FileText },
  { to: '/clients', label: 'Clientes', icon: UserCircle },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/users', label: 'Usuarios', icon: Users, adminOnly: true },
]

const platformNav = [
  { to: '/platform/companies', label: 'Empresas', icon: Building2 },
  { to: '/platform/roles', label: 'Roles y permisos', icon: Shield },
]

const tenantBusinessPaths = ['/dashboard', '/invoices', '/clients', '/products', '/users']

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { tenant } = useTenant()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (isSuperAdmin(user)) {
    const isPlatformRoute = location.pathname.startsWith('/platform')
    const isTenantRoute = tenantBusinessPaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    )

    if (isTenantRoute && !tenant) {
      return <Navigate to="/platform/companies" replace />
    }

    if (!isPlatformRoute && !isTenantRoute && location.pathname !== '/') {
      return <Navigate to={tenant ? '/dashboard' : '/platform/companies'} replace />
    }
  }

  return <AppLayout />
}

function AppLayout() {
  const { user, logout } = useAuth()
  const { tenant, clearTenant } = useTenant()
  const navigate = useNavigate()
  const superAdmin = isSuperAdmin(user)

  const navItems = superAdmin
    ? [...platformNav, ...(tenant ? businessNav : [])]
    : businessNav

  function roleLabel() {
    if (hasRole(user, 'super_admin')) return 'Super Admin'
    if (hasRole(user, 'admin')) return 'Admin'
    return 'Vendedor'
  }

  async function handleLogout() {
    clearTenant()
    await logout()
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-100 px-6 py-5">
          <Logo size="sm" />
          <p className="mt-2 text-xs text-slate-500">
            {superAdmin ? 'Panel plataforma' : 'Panel administrativo'}
          </p>
          {superAdmin && tenant && (
            <p className="mt-3 text-sm font-medium text-slate-800">{tenant.name}</p>
          )}
          {user?.company && !superAdmin && (
            <p className="mt-3 text-sm font-medium text-slate-800">{user.company.name}</p>
          )}
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 py-4 lg:flex-col lg:overflow-visible">
          {navItems.map((item) => {
            if ('adminOnly' in item && item.adminOnly) {
              if (superAdmin && tenant) {
                // super admin en contexto de empresa tiene acceso total
              } else if (!hasPermission(user, 'users.manage')) {
                return null
              }
            }

            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Sesión iniciada como</p>
            <p className="font-medium text-slate-900">{user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                {roleLabel()}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleLogout()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </header>

        {superAdmin && tenant && (
          <div className="border-b border-brand-100 bg-brand-50 px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-brand-800">
                Gestionando empresa: <strong>{tenant.name}</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  clearTenant()
                  navigate('/platform/companies')
                }}
                className="inline-flex items-center gap-2 text-sm text-brand-700 hover:underline"
              >
                <X className="h-4 w-4" />
                Salir de empresa
              </button>
            </div>
          </div>
        )}

        {superAdmin && !tenant && (
          <div className="px-6 pt-4">
            <Alert tone="success">
              Selecciona una empresa y pulsa &quot;Gestionar&quot; para crear clientes, productos, facturas y usuarios.
            </Alert>
          </div>
        )}

        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
