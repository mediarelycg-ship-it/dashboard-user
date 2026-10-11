import { cn } from '@/lib/utils'

// Logo "R" RELY; file sudah di-crop dari logo1.png (tanpa margin kosong)
export default function Logo({ className }) {
  return <img src="/logo-r.png" alt="RELY" className={cn('h-8 w-auto', className)} />
}
