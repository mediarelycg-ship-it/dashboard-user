import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { Button } from '@/components/ui/button'

// Tombol ganti mode terang/gelap; pilihan tersimpan di perangkat
export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'

  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} aria-label={label} title={label} className={className}>
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
