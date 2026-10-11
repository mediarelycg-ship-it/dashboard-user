import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import AuthShell from '@/components/AuthShell'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import OrDivider from '@/components/OrDivider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialForm = { name: '', email: '', password: '', confirmPassword: '' }

export default function RegisterPage() {
  const { saveSession } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi password tidak sama.')
      return
    }
    setLoading(true)
    try {
      const { name, email, password } = form
      // Setelah daftar, akun langsung masuk ke halaman "Menunggu Persetujuan"
      saveSession(await api.register({ name, email, password }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credential) => {
    setError('')
    try {
      saveSession(await api.loginWithGoogle(credential))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthShell title="Daftar" description="Buat akun member. Dashboard terbuka setelah disetujui master admin.">
      <GoogleSignInButton onCredential={handleGoogle} text="signup_with" />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama lengkap</Label>
          <Input id="name" name="name" required maxLength={100} value={form.name} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} value={form.password} onChange={handleChange} />
          <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} value={form.confirmPassword} onChange={handleChange} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Memproses...' : 'Daftar dengan email'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  )
}
