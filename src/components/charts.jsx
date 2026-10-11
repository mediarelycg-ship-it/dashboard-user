import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Grafik SVG ringan untuk dashboard. Warna mengikuti token tema (--primary, --border, --card).

const DEFAULT_WIDTH = 640
const PAD = { top: 12, right: 16, bottom: 26, left: 36 }

const dayFormat = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const shortDay = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const monthFull = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const shortMonth = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit', timeZone: 'UTC' })

// Titik data harian berformat YYYY-MM-DD, titik bulanan YYYY-MM
const isMonth = (date) => date.length === 7
const parseDay = (date) => new Date(isMonth(date) ? `${date}-01T00:00:00Z` : `${date}T00:00:00Z`)
const axisLabel = (date) => (isMonth(date) ? shortMonth : shortDay).format(parseDay(date))

const formatDay = (date) => (isMonth(date) ? monthFull : dayFormat).format(parseDay(date))

// Sumbu Y dengan tick bilangan bulat yang rapi: 0, step, 2*step, ...
function niceScale(max) {
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
  const step = steps.find((s) => Math.ceil(max / s) <= 4) || Math.ceil(max / 4)
  const count = Math.max(2, Math.ceil(max / step))
  return { step, max: count * step, ticks: Array.from({ length: count + 1 }, (_, i) => i * step) }
}

const tickLabel = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('id-ID')}K` : n.toLocaleString('id-ID'))

// Indeks label sumbu X: awal, tengah, akhir (5 label jika titik data banyak)
const labelIndexes = (n) => {
  if (n <= 3) return [...Array(n).keys()]
  if (n <= 8) return [0, Math.round((n - 1) / 2), n - 1]
  return [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(r * (n - 1)))
}

// Lebar kontainer terukur agar ukuran teks sumbu tetap, tidak ikut mengecil bersama SVG
function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

function DataTable({ caption, data, unit }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr><th>Tanggal</th><th>{unit}</th></tr>
      </thead>
      <tbody>
        {data.map((p) => (
          <tr key={p.date}><td>{p.date}</td><td>{p.count}</td></tr>
        ))}
      </tbody>
    </table>
  )
}

function Tooltip({ x, title, value, unit }) {
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
      style={{ left: `${x}%` }}
    >
      <p className="text-muted-foreground">{title}</p>
      <p className="font-semibold text-popover-foreground">{value.toLocaleString('id-ID')} {unit}</p>
    </div>
  )
}

function Frame({ data, unit, caption, width, height, scale, plotW, plotH, children, onMove, onLeave }) {
  return (
    <div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block w-full" role="img" aria-label={caption}>
        {scale.ticks.map((t) => {
          const y = PAD.top + plotH - (t / scale.max) * plotH
          return (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground" fontSize="11">
                {tickLabel(t)}
              </text>
            </g>
          )
        })}
        {children}
        {labelIndexes(data.length).map((i, k, arr) => {
          const x = PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
          return (
            <text
              key={i}
              x={x}
              y={height - 6}
              textAnchor={k === 0 ? 'start' : k === arr.length - 1 ? 'end' : 'middle'}
              className="fill-muted-foreground"
              fontSize="11"
            >
              {axisLabel(data[i].date)}
            </text>
          )
        })}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        />
      </svg>
      <DataTable caption={caption} data={data} unit={unit} />
    </div>
  )
}

// Tren satu seri: garis 2px + area 10%, titik akhir 8px dengan ring permukaan, crosshair + tooltip saat hover
export function TrendChart({ data, unit = 'data', caption, height = 220 }) {
  const gradientId = useId()
  const [ref, W] = useWidth()
  const [hover, setHover] = useState(null)
  const plotW = W - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const scale = niceScale(Math.max(1, ...data.map((d) => d.count)))

  const px = (i) => PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const py = (v) => PAD.top + plotH - (v / scale.max) * plotH
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(d.count).toFixed(1)}`).join(' ')
  const area = `${line} L${px(data.length - 1).toFixed(1)},${PAD.top + plotH} L${px(0).toFixed(1)},${PAD.top + plotH} Z`
  const last = data.length - 1

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setHover(Math.round(ratio * last))
  }

  return (
    <div ref={ref} className="relative">
      <Frame data={data} unit={unit} caption={caption} width={W} height={height} scale={scale} plotW={plotW} plotH={plotH} onMove={onMove} onLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <line x1={px(hover)} x2={px(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--border)" strokeWidth="1" />
        )}
        <circle
          cx={px(hover ?? last)}
          cy={py(data[hover ?? last].count)}
          r="4"
          fill="var(--primary)"
          stroke="var(--card)"
          strokeWidth="2"
          pointerEvents="none"
        />
      </Frame>
      {hover !== null && (
        <Tooltip x={(px(hover) / W) * 100} title={formatDay(data[hover].date)} value={data[hover].count} unit={unit} />
      )}
    </div>
  )
}

// Kolom harian: lebar maks 24px, ujung atas membulat 4px, rata di baseline
export function ColumnChart({ data, unit = 'data', caption, height = 220 }) {
  const [ref, W] = useWidth()
  const [hover, setHover] = useState(null)
  const plotW = W - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const scale = niceScale(Math.max(1, ...data.map((d) => d.count)))
  const slot = plotW / data.length
  const barW = Math.min(24, Math.max(2, slot - 3))

  const barPath = (x, h) => {
    const r = Math.min(4, h, barW / 2)
    const y = PAD.top + plotH - h
    return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`
  }

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(0.9999, Math.max(0, (e.clientX - rect.left) / rect.width))
    setHover(Math.floor(ratio * data.length))
  }

  return (
    <div ref={ref} className="relative">
      <Frame data={data} unit={unit} caption={caption} width={W} height={height} scale={scale} plotW={plotW} plotH={plotH} onMove={onMove} onLeave={() => setHover(null)}>
        {data.map((d, i) => {
          if (d.count === 0) return null
          const h = (d.count / scale.max) * plotH
          const x = PAD.left + i * slot + (slot - barW) / 2
          return <path key={d.date} d={barPath(x, h)} fill="var(--primary)" opacity={hover === null || hover === i ? 1 : 0.45} pointerEvents="none" />
        })}
      </Frame>
      {hover !== null && (
        <Tooltip
          x={((PAD.left + hover * slot + slot / 2) / W) * 100}
          title={formatDay(data[hover].date)}
          value={data[hover].count}
          unit={unit}
        />
      )}
    </div>
  )
}

// Perbandingan kategori: bar horizontal satu hue, nilai di ujung bar; item "tanpa kategori" berwarna abu
export function BarList({ items, unit = '', empty = 'Belum ada data' }) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name} title={`${item.name}: ${item.count.toLocaleString('id-ID')} ${unit}`.trim()}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{item.name}</span>
            <span className="shrink-0 font-medium tabular-nums">{item.count.toLocaleString('id-ID')}</span>
          </div>
          <div className="h-2 rounded-full bg-primary/10">
            <div
              className={cn('h-2 rounded-full', item.unassigned ? 'bg-muted-foreground/40' : 'bg-primary')}
              style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
