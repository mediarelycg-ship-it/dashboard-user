import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import { formatDateTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const { user } = useAuth()
  const [member, setMember] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'member') return
    api
      .getMe()
      .then(setMember)
      .catch((err) => setError(err.message))
  }, [user?.role])

  if (user?.role === 'master_admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beranda</h1>
          <p className="text-muted-foreground">Selamat datang, {user.name}. Gunakan menu Member Subscription untuk mengaktifkan member.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Beranda</h1>
        <p className="text-muted-foreground">Selamat datang, {member?.name || user?.name}.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            Status akun
          </CardTitle>
          <CardDescription>Akun Anda sudah aktif dan dapat mengakses dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {error && <p className="text-destructive">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">Aktif</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Diaktifkan oleh</span>
            <span>{member?.activatedBy?.name || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tanggal aktivasi</span>
            <span>{formatDateTime(member?.activatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
