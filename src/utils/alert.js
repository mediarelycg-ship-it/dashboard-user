import { toast } from 'sonner'

let loadingId = null
let confirmHandler = null

export function registerConfirmHandler(fn) {
  confirmHandler = fn
  return () => {
    if (confirmHandler === fn) confirmHandler = null
  }
}

export function showLoading(text = 'Memproses...') {
  if (loadingId !== null) toast.dismiss(loadingId)
  loadingId = toast.loading(text)
}

export function closeLoading() {
  if (loadingId !== null) toast.dismiss(loadingId)
  loadingId = null
}

export function showSuccess(message = 'Berhasil!') {
  toast.success(message)
}

export function showError(message = 'Terjadi kesalahan') {
  toast.error(message)
}

export function showConfirm(message = 'Apakah Anda yakin?', confirmText = 'Ya, hapus!') {
  if (!confirmHandler) return Promise.resolve(window.confirm(message))
  return confirmHandler({ message, confirmText })
}
