import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { getErrorMessage } from '../lib/format'
import { downloadTemplate, importSpreadsheet, type ImportResult } from '../lib/import'
import { Alert, Button, Card } from './ui'

interface ImportModalProps {
  title: string
  templatePath: string
  templateFilename: string
  importPath: string
  onCompleted?: () => void
  onClose: () => void
}

export function ImportModal({
  title,
  templatePath,
  templateFilename,
  importPath,
  onCompleted,
  onClose,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDownloadTemplate() {
    setError('')
    try {
      await downloadTemplate(templatePath, templateFilename)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await importSpreadsheet(importPath, file)
      setResult(data)
      onCompleted?.()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-4 text-sm text-slate-500">
          Descarga la plantilla Excel, llena tus datos y súbela aquí. Formatos: .xlsx, .xls, .csv
        </p>

        {error && <Alert>{error}</Alert>}

        <div className="mb-4">
          <Button type="button" variant="secondary" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4" />
            Descargar plantilla
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleImport}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Archivo</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="block w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {result && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-800">Resultado</p>
              <ul className="mt-2 space-y-1 text-slate-600">
                <li>Creados: {result.created}</li>
                <li>Actualizados: {result.updated}</li>
                <li>Omitidos: {result.skipped}</li>
              </ul>
              {result.errors.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto">
                  {result.errors.map((item) => (
                    <p key={`${item.row}-${item.message}`} className="text-xs text-red-600">
                      Fila {item.row}: {item.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="submit" loading={loading} disabled={!file}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function ImportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="secondary" onClick={onClick}>
      <Upload className="h-4 w-4" />
      {label}
    </Button>
  )
}
