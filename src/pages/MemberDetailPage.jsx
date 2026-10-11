import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Clock, Lock, Package as PackageIcon, Save, UserCheck, UserX } from 'lucide-react'
import { api } from '@/api/client'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { BILLING_PLANS, billingLabel, planPrice, typeLabel } from '@/lib/packages'
import { showConfirm, showError, showSuccess } from '@/utils/alert'
import PageHeader from '@/components/PageHeader'
import { FormField, LoadingState } from '@/components/common'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NONE = 'none'

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-medium">{children || '-'}</span>
    </div>
  )
}

export default function MemberDetailPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState(null)
  const [packages, setPackages] = useState([])
  const [packageId, setPackageId] = useState(NONE)
  const [billingPlan, setBillingPlan] = useState('monthly')
  const [saving, setSaving] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)

  const applyMember = (m) => {
    setMember(m)
    setPackageId(m.package ? String(m.package.id) : NONE)
    setBillingPlan(m.billingPlan || 'monthly')
  }

  useEffect(() => {
    let ignore = false
    Promise.all([api.getMemberDetail(id), api.getPackages({ activeOnly: true })])
      .then(([m, pkgs]) => {
        if (ignore) return
        setPackages(pkgs)
        applyMember(m)
      })
      .catch((err) => !ignore && showError(err.message))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [id])

  if (loading) return <LoadingState />
  if (!member) return <PageHeader title="Member tidak ditemukan" back="/members" />

  const isActive = member.status === 'active'
  const selected = packages.find((p) => String(p.id) === packageId)
  const unchanged =
    packageId === (member.package ? String(member.package.id) : NONE) &&
    (packageId === NONE || billingPlan === member.billingPlan)

  const savePackage = async () => {
    if (packageId === NONE) return
    setSaving(true)
    try {
      applyMember(await api.assignMemberPackage(id, { packageId: Number(packageId), billingPlan }))
      showSuccess('Paket member diperbarui')
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removePackage = async () => {
    const ok = await showConfirm(`Lepas paket ${member.package.name} dari ${member.name}?`, 'Ya, lepas paket')
    if (!ok) return
    setSaving(true)
    try {
      applyMember(await api.assignMemberPackage(id, { packageId: null }))
      showSuccess('Paket member dilepas')
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (action, confirmMessage) => {
    if (confirmMessage && !(await showConfirm(confirmMessage, 'Ya, cabut akses!'))) return
    setStatusBusy(true)
    try {
      await action()
      applyMember(await api.getMemberDetail(id))
    } catch (err) {
      showError(err.message)
    } finally {
      setStatusBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={member.name}
        description="Detail member subscription"
        back="/members"
        actions={
          isActive ? (
            <Button
              variant="outline"
              disabled={statusBusy}
              onClick={() =>
                changeStatus(() => api.revokeMember(id), `Cabut akses ${member.name}? Member akan kembali menunggu persetujuan.`)
              }
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <UserX /> Cabut akses
            </Button>
          ) : (
            <Button disabled={statusBusy} onClick={() => changeStatus(() => api.activateMember(id))}>
              <UserCheck /> Aktifkan user
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil member</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Lock className="size-3.5" /> Hanya baca. Profil hanya bisa diubah oleh member sendiri.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarImage src={member.picture || undefined} alt={member.name} referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                  {member.name.trim().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">{member.name}</p>
                <p className="truncate text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
            <InfoRow label="Nomor telepon">{member.phone}</InfoRow>
            <InfoRow label="Nomor virtual card"><span className="font-mono">{member.cardNumber}</span></InfoRow>
            <InfoRow label="Status">
              {isActive ? <Badge variant="success"><UserCheck /> Aktif</Badge> : <Badge variant="warning"><Clock /> Menunggu</Badge>}
            </InfoRow>
            <InfoRow label="Terdaftar">{formatDateTime(member.createdAt)}</InfoRow>
            <InfoRow label="Diaktifkan oleh">{member.activatedBy?.name}</InfoRow>
            <InfoRow label="Tanggal aktivasi">{member.activatedAt ? formatDateTime(member.activatedAt) : null}</InfoRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="size-5" /> Paket subscription
            </CardTitle>
            <CardDescription>
              {member.package
                ? `Paket saat ini: ${member.package.name} (${billingLabel(member.billingPlan)})`
                : 'Member belum memiliki paket.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Paket" htmlFor="package">
              <Select value={packageId} onValueChange={setPackageId}>
                <SelectTrigger id="package" className="w-full"><SelectValue placeholder="Pilih paket" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE} disabled>Pilih paket...</SelectItem>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name} ({typeLabel(p.type)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Billing plan" htmlFor="billingPlan">
              <Select value={billingPlan} onValueChange={setBillingPlan} disabled={!selected}>
                <SelectTrigger id="billingPlan" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BILLING_PLANS.map((b) => {
                    const price = selected ? b.price(selected) : null
                    return (
                      <SelectItem key={b.value} value={b.value} disabled={selected && price == null}>
                        {b.label}
                        {price != null && ` — ${formatRupiah(price)}${b.suffix}`}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </FormField>

            {selected && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">{selected.name}</p>
                <p className="text-muted-foreground">
                  {selected.advisoryHours} jam advisory/bulan · diskon {selected.specialDiscountPct}% · {selected.support || 'tanpa support'}
                </p>
                <p className="mt-1 font-medium">
                  {formatRupiah(planPrice(selected, billingPlan))}
                  {BILLING_PLANS.find((b) => b.value === billingPlan)?.suffix}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(belum termasuk WHT 2%)</span>
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={savePackage} disabled={saving || packageId === NONE || unchanged}>
                <Save /> {member.package ? 'Ubah paket' : 'Assign paket'}
              </Button>
              {member.package && (
                <Button variant="outline" onClick={removePackage} disabled={saving}>
                  Lepas paket
                </Button>
              )}
            </div>

            {member.package && (
              <div className="border-t pt-3 text-xs text-muted-foreground">
                Di-assign oleh <span className="font-medium text-foreground">{member.packageAssignedBy?.name || '-'}</span>
                {member.packageAssignedAt && <> pada {formatDateTime(member.packageAssignedAt)}</>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
