import { Loader2, Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function FormField({ label, htmlFor, hint, className, children }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function LoadingState({ text = 'Memuat data...', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground', className)}>
      <Loader2 className="size-4 animate-spin" /> {text}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title = 'Tidak ada data', description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-16 text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}

export function PaginationBar({ page, totalPages, total, onChange, loading, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row', className)}>
      <span>
        Halaman {page} dari {Math.max(1, totalPages)}
        {total != null && ` (${total} data)`}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1 || loading}>
          <ChevronLeft /> Sebelumnya
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages || loading}>
          Berikutnya <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

export function TableFooterBar({ page, totalPages, totalLabel, onPageChange, limit, onLimitChange, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3', className)}>
      <p className="text-xs text-muted-foreground">{totalLabel}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft /> Sebelumnya
        </Button>
        <span className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Berikutnya <ChevronRight />
        </Button>
        {onLimitChange && (
          <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
            <SelectTrigger size="sm" className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}/hal</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
