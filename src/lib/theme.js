import { useSyncExternalStore } from 'react'

// Pilihan tema disimpan di localStorage (bertahan walau tab/browser ditutup, tidak ikut logout).
// Jika belum pernah memilih, mengikuti pengaturan terang/gelap di perangkat.
const STORAGE_KEY = 'theme'
const listeners = new Set()

const isTheme = (value) => value === 'light' || value === 'dark'

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isTheme(saved)) return saved
  } catch {
    /* storage diblokir: pakai tema perangkat */
  }
  return systemTheme()
}

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

let current = readTheme()
applyTheme(current)

function update(theme) {
  current = theme
  applyTheme(theme)
  listeners.forEach((listener) => listener())
}

export function setTheme(theme) {
  if (!isTheme(theme)) return
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* tetap berlaku untuk sesi ini */
  }
  update(theme)
}

export const toggleTheme = () => setTheme(current === 'dark' ? 'light' : 'dark')

// Tab lain mengganti tema: ikut berubah
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY && isTheme(e.newValue)) update(e.newValue)
})

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current)
  return { theme, setTheme, toggleTheme }
}
