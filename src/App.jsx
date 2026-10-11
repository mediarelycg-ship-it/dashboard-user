import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import AppLayout from '@/components/AppLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import MembersPage from '@/pages/MembersPage'
import PendingApprovalPage from '@/pages/PendingApprovalPage'
import ProfilePage from '@/pages/ProfilePage'
import RegisterPage from '@/pages/RegisterPage'

// Halaman login/register tidak bisa diakses saat sudah login
function PublicOnly({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/" replace /> : children
}

function RequireAuth({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function RequireMasterAdmin({ children }) {
  const { user } = useAuth()
  return user?.role === 'master_admin' ? children : <Navigate to="/" replace />
}

// Member yang belum diaktifkan hanya melihat halaman penuh "Menunggu Persetujuan"
function AppShell() {
  const { user } = useAuth()
  if (user?.role === 'member' && user.status !== 'active') {
    return <PendingApprovalPage />
  }
  return <AppLayout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<HomePage />} />
        <Route
          path="profile"
          element={
            <ProfilePage />
          }
        />
        <Route
          path="members"
          element={
            <RequireMasterAdmin>
              <MembersPage />
            </RequireMasterAdmin>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
