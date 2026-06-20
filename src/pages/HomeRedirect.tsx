import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { isSuperAdmin } from '../lib/format'

export function HomeRedirect() {
  const { user } = useAuth()
  const { tenant } = useTenant()

  if (isSuperAdmin(user)) {
    return <Navigate to={tenant ? '/dashboard' : '/platform/companies'} replace />
  }

  return <Navigate to="/dashboard" replace />
}
