import { useState } from 'react'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/api/client'

// Foto profil (mis. dari Google); jika tidak ada atau gagal dimuat, tampilkan inisial nama
export default function Avatar({ name, picture, className }) {
  const [failed, setFailed] = useState(false)

  if (picture && !failed) {
    return (
      <img
        src={assetUrl(picture)}
        alt={name || 'Foto profil'}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn('size-9 shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground',
        className
      )}
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}
