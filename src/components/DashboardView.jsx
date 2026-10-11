import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  Clock,
  Coins,
  Database,
  FolderOpen,
  Globe,
  HelpCircle,
  MessagesSquare,
  Minus,
  Newspaper,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarList, ColumnChart, TrendChart } from '@/components/charts'

// Pilihan rentang waktu dashboard (sesuai query ?range= di backend)
const RANGE_OPTIONS = [
  { value: '7d', label: '7 hari', short: '7 hari', phrase: '7 hari terakhir' },
  { value: '30d', label: '1 bulan', short: '30 hari', phrase: '30 hari terakhir' },
  { value: '1y', label: '1 tahun', short: '12 bulan', phrase: '12 bulan terakhir' },
]

const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

const ACTION_LABEL = {
  EXPORT: 'Export knowledge',
  IMPORT: 'Import knowledge',
  CREATE_USER: 'Tambah user',
  UPDATE_USER: 'Update user',
  DEACTIVATE_USER: 'Cabut / nonaktifkan akses',
  ACTIVATE_USER: 'Aktifkan akun',
  UPDATE_PROFILE: 'Update profil',
  RESET_PASSWORD: 'Reset password',
  CREATE_PACKAGE: 'Tambah paket',
  UPDATE_PACKAGE: 'Update paket',
  DELETE_PACKAGE: 'Hapus paket',
  ASSIGN_PACKAGE: 'Assign paket',
  SYNC_PACKAGE_KNOWLEDGE: 'Sinkron data chatbot',
}

function timeAgo(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'baru saja'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

function SectionTitle({ children }) {
  return <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{children}</h2>
}

// Perubahan periode terpilih dibanding periode sebelumnya yang sama panjang
function Delta({ current, previous }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-muted-foreground">Belum ada data</span>
  if (previous === 0) return <span className="text-xs text-muted-foreground">Baru, belum ada pembanding</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus
  const tone = pct > 0 ? 'text-success' : pct < 0 ? 'text-destructive' : 'text-muted-foreground'
  return (
    <span className="flex items-center gap-1 text-xs">
      <Icon className={cn('size-3.5', tone)} />
      <span className={cn('font-medium', tone)}>{pct > 0 ? '+' : ''}{pct}%</span>
      <span className="text-muted-foreground">vs periode sebelumnya</span>
    </span>
  )
}

const TONES = {
  primary: 'bg-primary/10 text-primary',
  teal: 'bg-teal/10 text-teal',
  warning: 'bg-warning/15 text-warning',
  success: 'bg-success/10 text-success',
  muted: 'bg-muted text-muted-foreground',
}

function StatTile({ icon: Icon, label, value, tone = 'primary', footer, to }) {
  const body = (
    <Card className={cn('h-full py-0', to && 'transition-colors hover:border-primary/40')}>
      <CardContent className="flex items-start gap-4 p-5">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight">{value}</p>
          {footer && <div className="mt-1 text-xs text-muted-foreground">{footer}</div>}
        </div>
      </CardContent>
    </Card>
  )
  return to ? <Link to={to} className="block h-full">{body}</Link> : body
}

function ChartCard({ title, description, className, children }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function PendingCard({ members, total, links, onActivate }) {
  const [busyId, setBusyId] = useState(null)

  const activate = async (id) => {
    setBusyId(id)
    try {
      await onActivate(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            Menunggu persetujuan
            {total > 0 && <Badge variant="warning">{total}</Badge>}
          </CardTitle>
          <CardDescription>Akun baru yang belum bisa mengakses dashboard.</CardDescription>
        </div>
        {links.members && total > 5 && (
          <Button variant="outline" size="sm" asChild>
            <Link to={links.members}>Lihat semua</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Semua pendaftar sudah diproses.</p>
        ) : (
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="size-9">
                  <AvatarImage src={m.picture || undefined} alt={m.name} referrerPolicy="no-referrer" />
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {m.name.trim().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email} · {timeAgo(m.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  {links.members && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`${links.members}/${m.id}`}>Detail</Link>
                    </Button>
                  )}
                  <Button size="sm" disabled={busyId === m.id} onClick={() => activate(m.id)}>
                    <UserCheck /> Aktifkan
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityCard({ items, link, className }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-base">Aktivitas terbaru</CardTitle>
        {link && (
          <Button variant="outline" size="sm" asChild>
            <Link to={link}>Semua</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Belum ada aktivitas.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => {
              const detail = a.summary?.targetEmail || a.summary?.packageName || a.summary?.name
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{ACTION_LABEL[a.action] || a.action}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.userName}{detail && ` · ${detail}`} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1].map((row) => (
        <div key={row} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ))}
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}

// links: { members, packages, activity } - kosongkan jika halaman tujuan tidak ada di aplikasi ini
// range / onRangeChange: filter waktu; busy: true saat data rentang baru sedang dimuat
export default function DashboardView({ data, range = '7d', onRangeChange, busy = false, links = {}, onActivate }) {
  if (!data) return <DashboardSkeleton />

  const { chat, content, members, adminUsers, activity } = data
  const info = RANGE_OPTIONS.find((r) => r.value === data.range) || RANGE_OPTIONS[0]
  const per = data.unit === 'month' ? 'bulan' : 'hari'

  return (
    <div className={cn('space-y-8 transition-opacity', busy && 'opacity-60')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Menampilkan data <span className="font-medium text-foreground">{info.phrase}</span>, dibandingkan periode sebelumnya.
        </p>
        <Tabs value={range} onValueChange={onRangeChange}>
          <TabsList>
            {RANGE_OPTIONS.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>{r.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {members && (
        <section>
          <SectionTitle>Member subscription</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={Clock}
              tone="warning"
              label="Menunggu persetujuan"
              value={members.pending}
              to={links.members}
              footer={members.pending > 0 ? 'Perlu ditindaklanjuti' : 'Tidak ada antrean'}
            />
            <StatTile
              icon={UserCheck}
              tone="success"
              label="Member aktif"
              value={members.active}
              footer={`${members.withPackage} sudah punya paket · ${members.total} total`}
            />
            <StatTile
              icon={Wallet}
              tone="primary"
              label="Estimasi pendapatan / bulan"
              value={formatRupiah(members.monthlyRevenue)}
              to={links.packages}
              footer="Member aktif ber-paket, belum termasuk WHT"
            />
            <StatTile
              icon={ShieldCheck}
              tone="muted"
              label="Admin"
              value={`${adminUsers.active}/${adminUsers.total}`}
              footer="User admin aktif"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Registrasi member"
              description={`${members.registrationsPeriod.current} pendaftar dalam ${info.phrase} · per ${per}`}
            >
              <ColumnChart data={members.registrationsSeries} unit="pendaftar" caption={`Registrasi member per ${per}, ${info.phrase}`} />
            </ChartCard>
            <ChartCard title="Member per paket" description="Semua member, termasuk yang belum punya paket">
              <BarList items={members.byPackage} unit="member" empty="Belum ada member" />
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <PendingCard members={members.pendingList} total={members.pending} links={links} onActivate={onActivate} />
            <ActivityCard items={activity} link={links.activity} />
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Chatbot</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            icon={MessagesSquare}
            label={`Sesi chat (${info.short})`}
            value={chat.sessionsPeriod.current}
            footer={<Delta {...chat.sessionsPeriod} />}
          />
          <StatTile
            icon={HelpCircle}
            tone="teal"
            label={`Pertanyaan (${info.short})`}
            value={chat.questionsPeriod.current}
            footer={<Delta {...chat.questionsPeriod} />}
          />
          <StatTile
            icon={Database}
            tone="primary"
            label="Knowledge entries"
            value={content.knowledgeEntries.toLocaleString('id-ID')}
            footer={`${content.categories} kategori · ${content.websites} website`}
          />
          <StatTile
            icon={Coins}
            tone="muted"
            label={`Token OpenAI (${info.short})`}
            value={compact.format(chat.tokens.total)}
            footer={`${compact.format(chat.tokens.prompt)} prompt · ${compact.format(chat.tokens.completion)} jawaban`}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ChartCard
            className="lg:col-span-2"
            title="Pertanyaan ke chatbot"
            description={`${chat.questionsPeriod.current} pertanyaan dalam ${info.phrase} · per ${per} · ${chat.sessionsTotal.toLocaleString('id-ID')} sesi sepanjang waktu`}
          >
            <TrendChart data={chat.questionsSeries} unit="pertanyaan" caption={`Pertanyaan ke chatbot per ${per}, ${info.phrase}`} />
          </ChartCard>
          <ChartCard title="Website teratas" description={`Jumlah sesi chat, ${info.phrase}`}>
            <BarList items={chat.topWebsites} unit="sesi" empty="Belum ada sesi chat" />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionTitle>Konten</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            icon={Newspaper}
            label="Artikel terbit"
            value={content.articles.published}
            footer={`${content.articles.draft} draft`}
          />
          <StatTile
            icon={Brain}
            tone="teal"
            label="Tes kepribadian selesai"
            value={content.personality.completed}
            footer={`dari ${content.personality.participants} peserta`}
          />
          <StatTile icon={Globe} tone="primary" label="Website aktif" value={content.websites} />
          <StatTile icon={FolderOpen} tone="muted" label="Kategori aktif" value={content.categories} />
        </div>
        {!members && <ActivityCard className="mt-4" items={activity} link={links.activity} />}
      </section>

      {members && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" /> Data diperbarui {timeAgo(data.generatedAt)}
        </p>
      )}
    </div>
  )
}
