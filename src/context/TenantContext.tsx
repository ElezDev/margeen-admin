import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Company } from '../types/api'
import { clearStoredTenant, readStoredTenant, saveStoredTenant } from '../lib/tenant-storage'

interface TenantContextValue {
  tenant: Company | null
  selectTenant: (company: Company) => void
  clearTenant: () => void
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Company | null>(() => readStoredTenant())

  const selectTenant = useCallback((company: Company) => {
    saveStoredTenant(company)
    setTenant(company)
  }, [])

  const clearTenant = useCallback(() => {
    clearStoredTenant()
    setTenant(null)
  }, [])

  const value = useMemo(
    () => ({ tenant, selectTenant, clearTenant }),
    [tenant, selectTenant, clearTenant],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant debe usarse dentro de TenantProvider')
  }
  return context
}
