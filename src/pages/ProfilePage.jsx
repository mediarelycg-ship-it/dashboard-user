import { useEffect, useState } from 'react'
import { CalendarCheck, ShieldCheck, UserCheck } from 'lucide-react'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import { formatDateTime } from '@/lib/format'
import Avatar from '@/components/Avatar'
import AdminProfile from '@/pages/AdminProfile'
import MyPackageCard from '@/components/MyPackageCard'
import StatCard from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' }

function MemberProfile() {
  const { user, syncMember } = useAuth()
  const [member, setMember] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [passwords, setPasswords] = useState(emptyPasswords)
  const [loadError, setLoadError] = useState('')
  const [profileMsg, setProfileMsg] = useState(null)
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    api
      .getMe()
      .then((me) => {
        setMember(me)
        setForm({ name: me.name, phone: me.phone || '' })
      })
      .catch((err) => setLoadError(err.message))
  }, [])

  const applyUpdated = (me) => {
    setMember(me)
    setForm({ name: me.name, phone: me.phone || '' })
    syncMember(me)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileMsg(null)
    setSavingProfile(true)
    try {
      applyUpdated(await api.updateMe({ name: form.name, phone: form.phone }))
      setProfileMsg({ ok: true, text: 'Data diri berhasil diperbarui.' })
    } catch (err) {
      setProfileMsg({ ok: false, text: err.message })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMsg({ ok: false, text: 'Konfirmasi password baru tidak sama.' })
      return
    }
    setSavingPassword(true)
    try {
      await api.updateMe({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords(emptyPasswords)
      setPasswordMsg({ ok: true, text: 'Password berhasil diganti.' })
    } catch (err) {
      setPasswordMsg({ ok: false, text: err.message })
    } finally {
      setSavingPassword(false)
    }
  }

  const message = (msg) =>
    msg && <p className={msg.ok ? 'text-sm text-success' : 'text-sm text-destructive'}>{msg.text}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={member?.name || user?.name} picture={member?.picture || user?.picture} className="size-16 text-2xl" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{member?.name || user?.name}</h1>
          <p className="truncate text-muted-foreground">{member?.email || user?.email}</p>
        </div>
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Status akun" value="Aktif" icon={ShieldCheck} tone="teal" />
        <StatCard label="Diaktifkan oleh" value={member?.activatedBy?.name || '-'} icon={UserCheck} tone="primary" />
        <StatCard label="Tanggal aktivasi" value={formatDateTime(member?.activatedAt)} icon={CalendarCheck} tone="navy" />
      </div>

      <MyPackageCard />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data diri</CardTitle>
            <CardDescription>Perbarui nama dan nomor telepon Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={member?.email || ''} disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama lengkap</Label>
                <Input
                  id="name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  maxLength={30}
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              {message(profileMsg)}
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Menyimpan...' : 'Simpan perubahan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ganti password</CardTitle>
            <CardDescription>
              Akun yang mendaftar dengan Google belum punya password; kosongkan password saat ini untuk membuatnya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password saat ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              {message(passwordMsg)}
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Menyimpan...' : 'Ganti password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  return user?.role === 'master_admin' ? <AdminProfile /> : <MemberProfile />
}
