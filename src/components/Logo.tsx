interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
} as const

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="Margeen"
        className={`${sizes[size]} rounded-xl object-cover shadow-sm`}
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          <span className="text-brand-600">marg</span>
          <span className="text-accent-500">ee</span>
          <span className="text-brand-600">n</span>
        </span>
      )}
    </div>
  )
}
