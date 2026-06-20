import type { PaginatedMeta } from '../types/api'

export const DEFAULT_PAGE_SIZE = 15

export function normalizePaginatedMeta(raw: unknown): PaginatedMeta | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const meta = raw as Record<string, unknown>

  return {
    current_page: Number(meta.current_page ?? 1),
    per_page: Number(meta.per_page ?? DEFAULT_PAGE_SIZE),
    total: Number(meta.total ?? 0),
    last_page: Number(meta.last_page ?? 1),
  }
}

/** Normaliza respuestas paginadas de Laravel ({ data, meta, links }). */
export function extractPaginatedResponse<T>(payload: unknown): {
  items: T[]
  meta: PaginatedMeta | null
} {
  if (!payload || typeof payload !== 'object') {
    return { items: [], meta: null }
  }

  const body = payload as Record<string, unknown>

  if (Array.isArray(body.data)) {
    return {
      items: body.data as T[],
      meta: normalizePaginatedMeta(body.meta),
    }
  }

  if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    const inner = body.data as Record<string, unknown>
    if (Array.isArray(inner.data)) {
      return {
        items: inner.data as T[],
        meta: normalizePaginatedMeta(inner.meta),
      }
    }
  }

  return { items: [], meta: null }
}
