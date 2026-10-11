import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { api } from '@/api/client'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'active', label: 'Aktif' },
]

const EMPTY_DATA = { members: [], total: 0, page: 1, totalPages: 1, counts: { pending: 0, active: 0 } }

export default function MembersPage() {
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')

  // Setiap perubahan filter, halaman, atau reloadKey memicu pengambilan data terbaru
  useEffect(() => {
    let ignore = false
    api
      .getMembers({ status, page })
      .then((result) => {
        if (!ignore) setData(result)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [status, page, reloadKey])

  const reload = () => {
    setLoading(true)
    setError('')
    setReloadKey((k) => k + 1)
  }

  const changeFilter = (value) => {
    setLoading(true)
    setError('')
    setStatus(value)
    setPage(1)
  }

  const changePage = (next) => {
    setLoading(true)
    setPage(next)
  }

  const runAction = async (memberId, action) => {
    setActionId(memberId)
    setError('')
    try {
      await action()
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  const handleActivate = (member) => runAction(member.id, () => api.activateMember(member.id))

  const handleRevoke = (member) => {
    if (!window.confirm(`Cabut akses ${member.name}? Member akan kembali ke halaman menunggu persetujuan.`)) return
    runAction(member.id, () => api.revokeMember(member.id))
  }

  const total = data.counts.pending + data.counts.active

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Member Subscription</h1>
          <p className="text-muted-foreground">Setujui akun member agar bisa mengakses dashboard.</p>
        </div>
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Muat ulang
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">Menunggu persetujuan</p>
            <p className="mt-1 text-2xl font-semibold">{data.counts.pending}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">Member aktif</p>
            <p className="mt-1 text-2xl font-semibold">{data.counts.active}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">Total member</p>
            <p className="mt-1 text-2xl font-semibold">{total}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.label}
            size="sm"
            variant={status === filter.value ? 'default' : 'outline'}
            onClick={() => changeFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead>Diaktifkan oleh</TableHead>
                <TableHead>Tanggal aktivasi</TableHead>
                <TableHead className="px-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {loading ? 'Memuat data...' : 'Belum ada member.'}
                  </TableCell>
                </TableRow>
              )}
              {data.members.map((member) => {
                const isActive = member.status === 'active'
                return (
                  <TableRow key={member.id}>
                    <TableCell className="px-4 font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={isActive ? 'secondary' : 'outline'} className={cn(!isActive && 'text-amber-600')}>
                        {isActive ? 'Aktif' : 'Menunggu'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(member.createdAt)}</TableCell>
                    <TableCell>{member.activatedBy?.name || '-'}</TableCell>
                    <TableCell>{formatDateTime(member.activatedAt)}</TableCell>
                    <TableCell className="px-4 text-right">
                      {isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionId === member.id}
                          onClick={() => handleRevoke(member)}
                        >
                          Cabut akses
                        </Button>
                      ) : (
                        <Button size="sm" disabled={actionId === member.id} onClick={() => handleActivate(member)}>
                          Aktifkan user
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Halaman {data.page} dari {Math.max(1, data.totalPages)} ({data.total} data)
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>
            <ChevronLeft />
            Sebelumnya
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= data.totalPages || loading}
            onClick={() => changePage(page + 1)}
          >
            Berikutnya
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
