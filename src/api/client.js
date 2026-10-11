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
    throw new Error(data.error || 'Terjadi kesalahan, coba lagi.')
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

  // Manajemen member (master admin)
  getMembers: ({ status = '', page = 1, limit = 10 } = {}) => {
    const query = new URLSearchParams({ page, limit })
    if (status) query.set('status', status)
    return request(`/admin/members?${query.toString()}`)
  },
  activateMember: (id) =>
    request(`/admin/members/${id}/activate`, { method: 'POST' }),
  revokeMember: (id) =>
    request(`/admin/members/${id}/revoke`, { method: 'POST' }),
}
