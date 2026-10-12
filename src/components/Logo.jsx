import { cn } from '@/lib/utils'

export const COMPANY_NAME = 'Rely Consulting Group'

// Logo "R" RELY; file sudah di-crop dari logo1.png (tanpa margin kosong)
export default function Logo({ className }) {
  return <img src="/logo-r.png" alt="RELY" className={cn('h-8 w-auto dark:rounded-md dark:bg-white dark:p-1', className)} />
}

const SIZES = {
  sm: { logo: 'h-7', text: 'text-sm' },
  md: { logo: 'h-8', text: 'text-base' },
  lg: { logo: 'h-10', text: 'text-lg' },
}

// Logo + nama perusahaan; font dan ukuran nama selalu mengikuti ukuran logo
export function Brand({ size = 'md', subtitle, className, textClassName }) {
  const s = SIZES[size]
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <Logo className={s.logo} />
      <span className={cn('leading-tight font-semibold tracking-tight', s.text, textClassName)}>
        {COMPANY_NAME}
        {subtitle && <span className="block text-xs font-normal text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  )
}
