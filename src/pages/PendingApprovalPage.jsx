import { useState } from 'react'
import { Clock, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

// Halaman penuh: ditampilkan selama akun member belum diaktifkan master admin
export default function PendingApprovalPage() {
  const { user, logout, refreshStatus } = useAuth()
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')

  const handleCheck = async () => {
    setChecking(true)
    setMessage('')
    try {
      const me = await refreshStatus()
      if (me.status !== 'active') {
        setMessage('Akun Anda belum disetujui. Silakan coba lagi nanti.')
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Clock className="size-10" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">Menunggu Persetujuan</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Halo{user?.name ? `, ${user.name}` : ''}. Akun Anda{user?.email ? ` (${user.email})` : ''} sudah terdaftar.
        Dashboard akan terbuka setelah master admin mengaktifkan akun Anda.
      </p>

      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleCheck} disabled={checking}>
          <RefreshCw className={checking ? 'animate-spin' : ''} />
          {checking ? 'Memeriksa...' : 'Periksa status'}
        </Button>
        <Button variant="outline" onClick={logout}>
          <LogOut />
          Keluar
        </Button>
      </div>
    </div>
  )
}
