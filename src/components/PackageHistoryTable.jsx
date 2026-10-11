import { formatDate, formatDuration, formatRupiah } from '@/lib/format'
import { BILLING_PLANS, billingLabel, typeLabel } from '@/lib/packages'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const END_LABEL = { changed: 'Diganti', removed: 'Dilepas' }

// Tabel riwayat langganan paket. showAssigner: tampilkan siapa yang meng-assign (khusus admin)
export default function PackageHistoryTable({ rows, showAssigner = false }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">Paket</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Harga</TableHead>
          <TableHead>Mulai</TableHead>
          <TableHead>Berakhir</TableHead>
          <TableHead>Durasi</TableHead>
          <TableHead>Status</TableHead>
          {showAssigner && <TableHead className="pr-4">Di-assign oleh</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="px-4">
              <p className="font-medium">{r.packageName}</p>
              {r.packageType && <p className="text-xs text-muted-foreground">{typeLabel(r.packageType)}</p>}
            </TableCell>
            <TableCell>{billingLabel(r.billingPlan)}</TableCell>
            <TableCell>
              {formatRupiah(r.price)}
              <span className="text-xs text-muted-foreground">
                {BILLING_PLANS.find((b) => b.value === r.billingPlan)?.suffix}
              </span>
            </TableCell>
            <TableCell>{formatDate(r.startedAt)}</TableCell>
            <TableCell>{r.endedAt ? formatDate(r.endedAt) : <span className="text-muted-foreground">Sekarang</span>}</TableCell>
            <TableCell>{formatDuration(r.startedAt, r.endedAt)}</TableCell>
            <TableCell>
              {r.isCurrent ? (
                <Badge variant="success">Aktif</Badge>
              ) : (
                <Badge variant="muted">{END_LABEL[r.endReason] || 'Selesai'}</Badge>
              )}
            </TableCell>
            {showAssigner && <TableCell className="pr-4 text-muted-foreground">{r.assignedBy?.name || '-'}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
