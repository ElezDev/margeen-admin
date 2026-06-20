import { storageUrl } from '../lib/storageUrl'

interface CompanyLogoPreviewProps {
  logoUrl?: string | null
  logoPath?: string | null
  companyId?: number
  hasLogo?: boolean
}

export function CompanyLogoPreview({ logoUrl, logoPath, hasLogo }: CompanyLogoPreviewProps) {
  const src = storageUrl(logoUrl) ?? storageUrl(logoPath)

  if (!hasLogo || !src) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        Sin logo
      </div>
    )
  }

  return (
    <img
      src={src}
      alt="Logo empresa"
      className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
    />
  )
}
