import { useEffect, useRef, useState } from 'react'
import { Calendar, RotateCcw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Bar filter seragam untuk halaman daftar.
//   search : { value, onChange(q), placeholder }          kolom pencarian (di-debounce 350 ms)
//   selects: [{ id, value, onChange(v), options, label }] dropdown; options: [{ value, label }]
//   dates  : { from, to, onChange({ from?, to? }), label } rentang tanggal
//   active : true jika ada filter aktif -> tombol Reset muncul
//   summary: teks ringkas di kanan (mis. "3 dari 10 user")
export default function FilterBar({ search, selects = [], dates, active = false, onReset, summary, className }) {
  const [qLocal, setQLocal] = useState(search?.value ?? '')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleSearch = (e) => {
    const q = e.target.value
    setQLocal(q)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search.onChange(q), 350)
  }

  const handleReset = () => {
    clearTimeout(timer.current)
    setQLocal('')
    onReset?.()
  }

  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-2', className)}>
      {search && (
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qLocal}
            onChange={handleSearch}
            placeholder={search.placeholder || 'Cari...'}
            className="pl-8"
            aria-label={search.placeholder || 'Cari'}
          />
        </div>
      )}

      {selects.map((s) => (
        <Select key={s.id} value={s.value} onValueChange={s.onChange}>
          <SelectTrigger className="w-[170px]" aria-label={s.label}>
            <SelectValue placeholder={s.label} />
          </SelectTrigger>
          <SelectContent>
            {s.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {dates && (
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <Input
            type="date"
            value={dates.from}
            max={dates.to || undefined}
            onChange={(e) => dates.onChange({ from: e.target.value })}
            className="w-[150px]"
            aria-label={`${dates.label || 'Tanggal'} dari`}
          />
          <span className="text-xs text-muted-foreground">s/d</span>
          <Input
            type="date"
            value={dates.to}
            min={dates.from || undefined}
            onChange={(e) => dates.onChange({ to: e.target.value })}
            className="w-[150px]"
            aria-label={`${dates.label || 'Tanggal'} sampai`}
          />
        </div>
      )}

      {active && (
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw /> Reset
        </Button>
      )}

      {summary && <p className="ml-auto text-sm text-muted-foreground">{summary}</p>}
    </div>
  )
}
