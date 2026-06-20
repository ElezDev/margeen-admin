/** Convierte logo_path o logo_url de la API en una ruta usable por el panel (proxy /storage). */
export function storageUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) {
    return null
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      return new URL(pathOrUrl).pathname
    } catch {
      return pathOrUrl
    }
  }

  if (pathOrUrl.startsWith('/storage/')) {
    return pathOrUrl
  }

  return `/storage/${pathOrUrl.replace(/^\/+/, '')}`
}
