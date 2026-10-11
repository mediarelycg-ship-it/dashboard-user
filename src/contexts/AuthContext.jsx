import { useCallback, useState } from 'react'
import { api } from '@/api/client'
import { AuthContext } from '@/contexts/auth-context'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  // Dipanggil setelah login / register / login Google berhasil
  const saveSession = useCallback((data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

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
      localStorage.setItem('user', JSON.stringify(merged))
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
