import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { api } from '@/api/client'
import FilterBar from '@/components/FilterBar'
import PackageHistoryTable from '@/components/PackageHistoryTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const NO_RANGE = { from: '', to: '' }

// Riwayat paket yang pernah diambil member, dengan filter rentang waktu
export default function MyPackageHistory() {
  const [range, setRange] = useState(NO_RANGE)
  const [state, setState] = useState({ key: null, rows: [], error: '' })

  const requestKey = `${range.from}|${range.to}`
  const loading = state.key !== requestKey
  const isFiltered = Boolean(range.from || range.to)

  useEffect(() => {
    let ignore = false
    api
      .getMyPackageHistory(range)
      .then((data) => !ignore && setState({ key: requestKey, rows: data.history, error: '' }))
      .catch((err) => !ignore && setState({ key: requestKey, rows: [], error: err.message }))
    return () => {
      ignore = true
    }
    // requestKey sudah mewakili range
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const { rows, error } = state

  // Tanpa riwayat sama sekali (dan tanpa filter): tidak perlu menampilkan kartu
  if (!loading && !error && rows.length === 0 && !isFiltered) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5" /> Riwayat paket
        </CardTitle>
        <CardDescription>Paket yang pernah Anda ambil beserta periodenya.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilterBar
          dates={{ label: 'Periode', from: range.from, to: range.to, onChange: (p) => setRange((prev) => ({ ...prev, ...p })) }}
          active={isFiltered}
          onReset={() => setRange(NO_RANGE)}
          summary={!loading ? `${rows.length} langganan` : undefined}
          className="mb-0"
        />
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Memuat riwayat...</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada langganan pada rentang waktu ini.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <PackageHistoryTable rows={rows} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
