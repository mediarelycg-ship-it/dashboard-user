import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { assetUrl } from '@/api/client'
import { showError, showSuccess } from '@/utils/alert'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Foto bulat, atau inisial nama jika belum ada foto / gagal dimuat
function Photo({ name, picture, className, textClassName }) {
  const [failed, setFailed] = useState(false)
  if (picture && !failed) {
    return (
      <img
        src={assetUrl(picture)}
        alt={name || 'Foto profil'}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn('size-full object-cover', className)}
      />
    )
  }
  return (
    <span
      className={cn(
        'flex size-full items-center justify-center bg-primary font-semibold text-primary-foreground',
        textClassName,
        className
      )}
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

// Foto profil dengan ikon kamera di tepi bawah (langsung pilih file) dan pop-up pembesaran foto.
// onUpload(file) / onRemove() mengembalikan promise. isCustom: foto hasil upload sendiri.
// googleFallback: menghapus foto upload akan kembali ke foto Google.
export default function ProfilePhoto({ name, picture, isCustom, googleFallback, onUpload, onRemove }) {
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const run = async (action, successText) => {
    setBusy(true)
    try {
      await action()
      showSuccess(successText)
    } catch (err) {
      showError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // izinkan memilih file yang sama lagi
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.')
      return
    }
    if (file.size > MAX_SIZE) {
      showError('Ukuran foto terlalu besar. Maksimal 2 MB.')
      return
    }
    run(() => onUpload(file), 'Foto profil berhasil diganti')
  }

  const pickFile = () => inputRef.current?.click()

  return (
    <>
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="hidden" onChange={handleFile} />

      <div className="relative mb-4 size-24 shrink-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Lihat foto profil"
          className="block size-full cursor-zoom-in overflow-hidden rounded-full ring-1 ring-border outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Photo key={picture || 'none'} name={name} picture={picture} textClassName="text-4xl" />
        </button>
        <button
          type="button"
          onClick={pickFile}
          disabled={busy}
          aria-label="Ganti foto profil"
          title="Ganti foto"
          className="absolute bottom-0 left-1/2 flex size-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
        >
          <Camera className="size-4" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto profil</DialogTitle>
            <DialogDescription>
              JPG, PNG, atau WebP, maksimal 2 MB.
              {googleFallback && !isCustom && ' Saat ini memakai foto dari akun Google Anda.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border bg-muted">
            <Photo key={picture || 'none'} name={name} picture={picture} textClassName="text-8xl" />
          </div>

          <DialogFooter className="gap-2 sm:justify-center">
            <Button type="button" disabled={busy} onClick={pickFile}>
              <Camera /> {busy ? 'Memproses...' : 'Ganti foto'}
            </Button>
            {isCustom && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  run(onRemove, googleFallback ? 'Foto profil kembali memakai foto Google' : 'Foto profil dihapus')
                }
              >
                <Trash2 /> {googleFallback ? 'Pakai foto Google' : 'Hapus foto'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
