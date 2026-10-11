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

export default function LoginPage() {
  const { saveSession } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      saveSession(await api.login(form.email, form.password))
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
    <AuthShell title="Masuk" description="Masuk untuk mengakses dashboard member">
      <GoogleSignInButton onCredential={handleGoogle} text="signin_with" />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required value={form.password} onChange={handleChange} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun?{' '}
        <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Daftar
        </Link>
      </p>
    </AuthShell>
  )
}
