import { useCallback, useEffect, useState } from 'react'
import { api } from '@/api/client'
import { AuthContext } from '@/contexts/auth-context'

// Token lama dari versi sebelumnya yang masih tersimpan di localStorage dibuang
try {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
} catch { /* abaikan jika storage diblokir */ }

// Waktu kedaluwarsa token (ms) dari klaim exp di payload JWT
function tokenExpiresAt(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

// Auto logout diam-diam saat token (2 jam) habis. Dicek lewat timer dan saat tab kembali aktif,
// karena timer bisa tertunda ketika komputer sleep.
function useAutoLogout(token, logout) {
  useEffect(() => {
    if (!token) return undefined
    const expiresAt = tokenExpiresAt(token)
    if (!expiresAt) return undefined

    const check = () => {
      if (Date.now() >= expiresAt) logout()
    }
    const timer = setTimeout(logout, Math.max(expiresAt - Date.now(), 0))
    document.addEventListener('visibilitychange', check)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [token, logout])
}

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(() => sessionStorage.getItem('token'))

  // Dipanggil setelah login / register / login Google berhasil
  const saveSession = useCallback((data) => {
    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  useAutoLogout(token, logout)

  // Samakan data user yang tersimpan (nama, foto, status) dengan data member terbaru
  const syncMember = useCallback((me) => {
    setUser((prev) => {
      const merged = {
        ...prev,
        name: me.name,
        picture: me.picture || null,
        status: me.status,
        subscribed: Boolean(me.package),
      }
      sessionStorage.setItem('user', JSON.stringify(merged))
      return merged
    })
  }, [])

  // Ambil ulang status akun, misalnya setelah master admin mengaktifkan akun
  const refreshStatus = useCallback(async () => {
    const me = await api.getMe()
    syncMember(me)
    return me
  }, [syncMember])

  return (
    <AuthContext.Provider value={{ user, token, saveSession, logout, refreshStatus, syncMember }}>
      {children}
    </AuthContext.Provider>
  )
}
