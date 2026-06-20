import type { Company } from '../types/api'

const TENANT_KEY = 'margeen_tenant_company'

export function readStoredTenant(): Company | null {
  const raw = localStorage.getItem(TENANT_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as Company
  } catch {
    return null
  }
}

export function saveStoredTenant(company: Company): void {
  localStorage.setItem(TENANT_KEY, JSON.stringify(company))
}

export function clearStoredTenant(): void {
  localStorage.removeItem(TENANT_KEY)
}

export function getTenantCompanyId(): number | null {
  return readStoredTenant()?.id ?? null
}
