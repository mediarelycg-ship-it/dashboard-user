import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import MasterDashboard from '@/components/MasterDashboard'
import VirtualCard from '@/components/VirtualCard'

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
        <MasterDashboard />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Hero name={member?.name || user?.name}>
        <p className="mt-2 max-w-xl text-white/70">Berikut virtual card member Anda.</p>
      </Hero>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <VirtualCard name={member?.name || user?.name} cardNumber={member?.cardNumber} />
    </div>
  )
}
