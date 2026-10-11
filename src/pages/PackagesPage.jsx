import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Package as PackageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/api/client'
import { formatRupiah } from '@/lib/format'
import { typeLabel } from '@/lib/packages'
import { showConfirm, showError, showLoading, closeLoading, showSuccess } from '@/utils/alert'
import PageHeader from '@/components/PageHeader'
import { LoadingState, EmptyState } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function PackagesPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ key: null, packages: [] })
  const [syncing, setSyncing] = useState(false)

  const loading = state.key !== reloadKey
  const packages = loading ? [] : state.packages

  useEffect(() => {
    let ignore = false
    api
      .getPackages()
      .then((data) => {
        if (!ignore) setState({ key: reloadKey, packages: data })
      })
      .catch((err) => {
        if (!ignore) {
          setState({ key: reloadKey, packages: [] })
          showError(err.message)
        }
      })
    return () => {
      ignore = true
    }
  }, [reloadKey])

  const handleDelete = async (pkg) => {
    const ok = await showConfirm(`Hapus paket ${pkg.name}? Data coverage paket ini ikut terhapus.`)
    if (!ok) return
    try {
      await api.deletePackage(pkg.id)
      showSuccess('Paket dihapus')
      setReloadKey((k) => k + 1)
    } catch (err) {
      showError(err.message)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    showLoading('Menyinkronkan data chatbot...')
    try {
      const r = await api.syncPackageKnowledge()
      closeLoading()
      showSuccess(`Chatbot diperbarui: ${r.created} baru, ${r.updated} diperbarui, ${r.unchanged} tetap, ${r.removed} dihapus`)
    } catch (err) {
      closeLoading()
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paket Membership"
        description="Kelola harga, benefit, dan layanan tiap paket. Perubahan otomatis diperbarui ke data chatbot."
        actions={
          <>
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <Bot /> Sinkronkan chatbot
            </Button>
            <Button asChild>
              <Link to="/packages/new">
                <Plus /> Tambah paket
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden py-0">
        {loading ? (
          <LoadingState />
        ) : packages.length === 0 ? (
          <EmptyState icon={PackageIcon} title="Belum ada paket" description="Tambahkan paket atau jalankan seeder paket." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="px-4">Paket</TableHead>
                <TableHead>Bulanan</TableHead>
                <TableHead>Promo</TableHead>
                <TableHead>Tahunan</TableHead>
                <TableHead>Advisory</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="px-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="px-4">
                    <p className="font-medium">{pkg.name}</p>
                    <Badge variant="secondary" className="mt-1">{typeLabel(pkg.type)}</Badge>
                  </TableCell>
                  <TableCell>{formatRupiah(pkg.monthlyPrice)}</TableCell>
                  <TableCell>
                    {formatRupiah(pkg.promoMonthlyPrice)}
                    {pkg.promoLabel && <p className="text-xs text-muted-foreground">{pkg.promoLabel}</p>}
                  </TableCell>
                  <TableCell>{formatRupiah(pkg.annualPrice)}</TableCell>
                  <TableCell>{pkg.advisoryHours} jam/bln</TableCell>
                  <TableCell>{pkg.specialDiscountPct}%</TableCell>
                  <TableCell>{pkg.memberCount}</TableCell>
                  <TableCell>
                    {pkg.isActive ? <Badge variant="success">Aktif</Badge> : <Badge variant="muted">Nonaktif</Badge>}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/packages/${pkg.id}/edit`}>
                          <Pencil /> Edit
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pkg)}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 /> Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
