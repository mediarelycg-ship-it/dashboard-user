export function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatRupiah(value) {
  if (value === null || value === undefined) return '-'
  return `Rp ${Number(value).toLocaleString('id-ID')}`
}
