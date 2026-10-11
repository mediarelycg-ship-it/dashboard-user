export function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatRupiah(value) {
  if (value === null || value === undefined) return '-'
  return `Rp ${Number(value).toLocaleString('id-ID')}`
}

export function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Lama periode: "5 jam", "12 hari", "3 bln 4 hr". end kosong = sampai sekarang
export function formatDuration(start, end) {
  const ms = Math.max(0, (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime())
  const hours = Math.floor(ms / 3600000)
  if (hours < 1) return '< 1 jam'
  if (hours < 24) return `${hours} jam`
  const days = Math.floor(hours / 24)
  if (days < 31) return `${days} hari`
  const months = Math.floor(days / 30)
  const rest = days % 30
  return rest ? `${months} bln ${rest} hr` : `${months} bln`
}
