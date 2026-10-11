import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import Avatar from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Profil master admin: nama dan password (email hanya bisa diubah dari dashboard admin)
export default function AdminProfile() {
  const { user, syncMember } = useAuth()
  const [email, setEmail] = useState(user?.email || '')
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getAdminProfile()
      .then((me) => {
        setEmail(me.email)
        setName(me.name)
      })
      .catch((err) => setMessage({ ok: false, text: err.message }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    if (password && password !== confirmPassword) {
      setMessage({ ok: false, text: 'Konfirmasi password baru tidak sama.' })
      return
    }
    setSaving(true)
    try {
      const data = { name }
      if (password) data.password = password
      const updated = await api.updateAdminProfile(data)
      syncMember({ ...updated, picture: null })
      setPassword('')
      setConfirmPassword('')
      setMessage({ ok: true, text: 'Profil berhasil diperbarui.' })
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={name} className="size-16 text-2xl" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="truncate text-muted-foreground">{email} · Master Admin</p>
        </div>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Data diri</CardTitle>
          <CardDescription>Perbarui nama atau ganti password. Kosongkan password jika tidak ingin mengubahnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama lengkap</Label>
              <Input id="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password baru</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {message && <p className={message.ok ? 'text-sm text-success' : 'text-sm text-destructive'}>{message.text}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan perubahan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
