import { useEffect, useState } from 'react'
import { CalendarCheck, CheckCircle2, ShieldCheck, UserCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import { formatDateTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/StatCard'

function Hero({ name, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white md:p-8">
      <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-teal/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-primary/50 blur-3xl" />
      <div className="relative">
        <p className="text-sm text-white/60">Beranda</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Selamat datang, {name}</h1>
        {children}
      </div>
    </div>
  )
}

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
        <Hero name={user.name}>
          <p className="mt-2 max-w-xl text-white/70">Gunakan menu Member Subscription untuk menyetujui dan mengaktifkan akun member.</p>
          <Button asChild className="mt-6 bg-teal text-navy hover:bg-teal/90">
            <Link to="/members">
              <Users />
              Kelola member
            </Link>
          </Button>
        </Hero>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Hero name={member?.name || user?.name}>
        <p className="mt-2 max-w-xl text-white/70">Akun Anda sudah aktif dan dapat mengakses dashboard.</p>
      </Hero>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Status akun" value="Aktif" icon={ShieldCheck} tone="teal" />
        <StatCard label="Diaktifkan oleh" value={member?.activatedBy?.name || '-'} icon={UserCheck} tone="primary" />
        <StatCard label="Tanggal aktivasi" value={formatDateTime(member?.activatedAt)} icon={CalendarCheck} tone="navy" />
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" />
            Status akun
          </CardTitle>
          <CardDescription>Ringkasan akses akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {error && <p className="text-destructive">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="success">Aktif</Badge>
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
