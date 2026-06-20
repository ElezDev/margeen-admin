import { api } from './api'

export interface ImportResult {
  created: number
  updated: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

export async function downloadTemplate(path: string, filename: string): Promise<void> {
  const response = await api.get(path, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function importSpreadsheet(path: string, file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<{ data: ImportResult }>(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data.data
}
