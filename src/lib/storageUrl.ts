export function storageUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) {
    return null
  }

  // Si ya es una URL completa, devolverla tal cual
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://')
  ) {
    return pathOrUrl
  }

  const storageBase =
    import.meta.env.VITE_STORAGE_URL ||
    import.meta.env.VITE_API_URL?.replace(/\/api$/, '')

  if (pathOrUrl.startsWith('/storage/')) {
    return `${storageBase}${pathOrUrl}`
  }

  return `${storageBase}/storage/${pathOrUrl.replace(/^\/+/, '')}`
}