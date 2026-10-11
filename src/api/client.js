const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api`

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && token) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Sesi berakhir, silakan login ulang.')
  }

  if (!res.ok) {
    // code (mis. NOT_SUBSCRIBED, PENDING_APPROVAL) membantu UI memilih tampilan yang tepat
    throw Object.assign(new Error(data.error || 'Terjadi kesalahan, coba lagi.'), { code: data.code })
  }

  return data
}

export const api = {
  // Member subscription (publik)
  register: (data) =>
    request('/members/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (email, password) =>
    request('/members/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  loginWithGoogle: (credential) =>
    request('/members/google', { method: 'POST', body: JSON.stringify({ credential }) }),

  // Member (sudah login)
  getMe: () => request('/members/me'),
  updateMe: (data) =>
    request('/members/me', { method: 'PUT', body: JSON.stringify(data) }),

  // Profil master admin (endpoint admin yang sudah ada)
  getAdminProfile: () => request('/auth/me'),
  updateAdminProfile: (data) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Agent / chatbot (hanya member aktif yang sudah berlangganan)
  getAgentSessions: () => request('/members/agent/sessions?limit=50'),
  createAgentSession: () => request('/members/agent/sessions', { method: 'POST' }),
  getAgentSession: (sessionId) => request(`/members/agent/sessions/${sessionId}`),
  sendAgentMessage: (sessionId, message) =>
    request(`/members/agent/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Paket milik member yang sedang login (hanya akun aktif)
  getMyPackage: () => request('/members/me/package'),
  getMyPackageHistory: ({ from, to } = {}) => {
    const query = new URLSearchParams()
    if (from) query.set('from', from)
    if (to) query.set('to', to)
    const qs = query.toString()
    return request(`/members/me/package-history${qs ? `?${qs}` : ''}`)
  },

  getDashboard: (range = '7d') => request(`/admin/dashboard?range=${range}`),

  // Paket membership (master admin)
  getPackages: ({ activeOnly = false } = {}) =>
    request(`/admin/packages${activeOnly ? '?activeOnly=true' : ''}`),
  getPackage: (id) => request(`/admin/packages/${id}`),
  createPackage: (data) =>
    request('/admin/packages', { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id, data) =>
    request(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePackage: (id) => request(`/admin/packages/${id}`, { method: 'DELETE' }),
  getPackageServices: () => request('/admin/package-services'),
  syncPackageKnowledge: () =>
    request('/admin/packages/sync-knowledge', { method: 'POST' }),
  getMemberDetail: (id) => request(`/admin/members/${id}`),
  assignMemberPackage: (id, data) =>
    request(`/admin/members/${id}/package`, { method: 'PUT', body: JSON.stringify(data) }),

  // Manajemen member (master admin)
  getMembers: ({ status = '', page = 1, limit = 10, q, packageId, from, to } = {}) => {
    const query = new URLSearchParams({ page, limit })
    if (status) query.set('status', status)
    for (const [key, value] of Object.entries({ q, packageId, from, to })) {
      if (value) query.set(key, value)
    }
    return request(`/admin/members?${query.toString()}`)
  },
  activateMember: (id) =>
    request(`/admin/members/${id}/activate`, { method: 'POST' }),
  revokeMember: (id) =>
    request(`/admin/members/${id}/revoke`, { method: 'POST' }),
}
