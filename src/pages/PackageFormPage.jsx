import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { api } from '@/api/client'
import { PACKAGE_TYPES } from '@/lib/packages'
import { showError, showSuccess } from '@/utils/alert'
import PageHeader from '@/components/PageHeader'
import { FormField, LoadingState } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const EMPTY_FORM = {
  name: '',
  type: 'personal',
  description: '',
  monthlyPrice: '',
  promoMonthlyPrice: '',
  promoLabel: '',
  annualPrice: '',
  advisoryHours: '0',
  support: '',
  emergencySupport: '',
  loyaltyPointValue: '',
  specialDiscountPct: '0',
  notes: '',
  sortOrder: '0',
  isActive: true,
}

const str = (value) => (value === null || value === undefined ? '' : String(value))
const optionalInt = (value) => (value === '' ? null : Number(value))

export default function PackageFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [groups, setGroups] = useState([]) // katalog layanan per perusahaan
  const [coverage, setCoverage] = useState({}) // { [serviceId]: catatan } -> ada = termasuk paket

  useEffect(() => {
    let ignore = false
    Promise.all([api.getPackageServices(), isEdit ? api.getPackage(id) : Promise.resolve(null)])
      .then(([catalog, pkg]) => {
        if (ignore) return
        setGroups(catalog)
        if (pkg) {
          setForm({
            name: pkg.name,
            type: pkg.type,
            description: str(pkg.description),
            monthlyPrice: str(pkg.monthlyPrice),
            promoMonthlyPrice: str(pkg.promoMonthlyPrice),
            promoLabel: str(pkg.promoLabel),
            annualPrice: str(pkg.annualPrice),
            advisoryHours: str(pkg.advisoryHours),
            support: str(pkg.support),
            emergencySupport: str(pkg.emergencySupport),
            loyaltyPointValue: str(pkg.loyaltyPointValue),
            specialDiscountPct: str(pkg.specialDiscountPct),
            notes: str(pkg.notes),
            sortOrder: str(pkg.sortOrder),
            isActive: pkg.isActive,
          })
          setCoverage(Object.fromEntries(pkg.coverage.map((c) => [c.serviceId, c.note || ''])))
        }
      })
      .catch((err) => !ignore && showError(err.message))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [id, isEdit])

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))
  const onChange = (e) => setField(e.target.name, e.target.value)

  const toggleService = (serviceId, checked) =>
    setCoverage((prev) => {
      const next = { ...prev }
      if (checked) next[serviceId] = next[serviceId] ?? ''
      else delete next[serviceId]
      return next
    })

  const toggleGroup = (group, checked) =>
    setCoverage((prev) => {
      const next = { ...prev }
      for (const s of group.services) {
        if (checked) next[s.id] = next[s.id] ?? ''
        else delete next[s.id]
      }
      return next
    })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      type: form.type,
      description: form.description,
      monthlyPrice: Number(form.monthlyPrice),
      promoMonthlyPrice: optionalInt(form.promoMonthlyPrice),
      promoLabel: form.promoLabel,
      annualPrice: optionalInt(form.annualPrice),
      advisoryHours: Number(form.advisoryHours || 0),
      support: form.support,
      emergencySupport: form.emergencySupport,
      loyaltyPointValue: optionalInt(form.loyaltyPointValue),
      specialDiscountPct: Number(form.specialDiscountPct || 0),
      notes: form.notes,
      sortOrder: Number(form.sortOrder || 0),
      isActive: form.isActive,
      coverage: Object.entries(coverage).map(([serviceId, note]) => ({ serviceId: Number(serviceId), note: note || null })),
    }

    setSaving(true)
    try {
      if (isEdit) await api.updatePackage(id, payload)
      else await api.createPackage(payload)
      showSuccess(isEdit ? 'Paket diperbarui. Data chatbot disinkronkan di background.' : 'Paket dibuat. Data chatbot disinkronkan di background.')
      navigate('/packages')
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState />

  const selectedCount = Object.keys(coverage).length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title={isEdit ? `Edit Paket: ${form.name}` : 'Tambah Paket'}
        description="Harga dalam Rupiah dan belum termasuk WHT 2%."
        back="/packages"
        actions={
          <Button type="submit" disabled={saving}>
            <Save /> {saving ? 'Menyimpan...' : 'Simpan paket'}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi paket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Nama paket" htmlFor="name">
              <Input id="name" name="name" required maxLength={100} value={form.name} onChange={onChange} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tipe" htmlFor="type">
                <Select value={form.type} onValueChange={(v) => setField('type', v)}>
                  <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PACKAGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Urutan tampil" htmlFor="sortOrder">
                <Input id="sortOrder" name="sortOrder" type="number" min={0} value={form.sortOrder} onChange={onChange} />
              </FormField>
            </div>
            <FormField label="Deskripsi" htmlFor="description">
              <Textarea id="description" name="description" rows={2} maxLength={500} value={form.description} onChange={onChange} />
            </FormField>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Paket aktif</p>
                <p className="text-xs text-muted-foreground">Paket nonaktif tidak bisa di-assign dan tidak masuk data chatbot.</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setField('isActive', v)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Harga</CardTitle>
            <CardDescription>Kosongkan harga promo atau tahunan jika tidak tersedia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Harga bulanan (Rp)" htmlFor="monthlyPrice">
              <Input id="monthlyPrice" name="monthlyPrice" type="number" min={0} required value={form.monthlyPrice} onChange={onChange} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Harga promo bulanan (Rp)" htmlFor="promoMonthlyPrice">
                <Input id="promoMonthlyPrice" name="promoMonthlyPrice" type="number" min={0} value={form.promoMonthlyPrice} onChange={onChange} />
              </FormField>
              <FormField label="Label promo" htmlFor="promoLabel">
                <Input id="promoLabel" name="promoLabel" maxLength={50} placeholder="GL26 Promo" value={form.promoLabel} onChange={onChange} />
              </FormField>
            </div>
            <FormField label="Harga tahunan (Rp)" htmlFor="annualPrice">
              <Input id="annualPrice" name="annualPrice" type="number" min={0} value={form.annualPrice} onChange={onChange} />
            </FormField>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Benefit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Advisory (jam / bulan)" htmlFor="advisoryHours">
              <Input id="advisoryHours" name="advisoryHours" type="number" min={0} value={form.advisoryHours} onChange={onChange} />
            </FormField>
            <FormField label="Support" htmlFor="support">
              <Input id="support" name="support" maxLength={255} placeholder="Unlimited Support" value={form.support} onChange={onChange} />
            </FormField>
            <FormField label="Emergency support" htmlFor="emergencySupport">
              <Input id="emergencySupport" name="emergencySupport" maxLength={255} placeholder="Online Call Meeting" value={form.emergencySupport} onChange={onChange} />
            </FormField>
            <FormField label="Loyalty points: 1 poin = Rp" htmlFor="loyaltyPointValue">
              <Input id="loyaltyPointValue" name="loyaltyPointValue" type="number" min={0} value={form.loyaltyPointValue} onChange={onChange} />
            </FormField>
            <FormField label="Special price (diskon %)" htmlFor="specialDiscountPct">
              <Input id="specialDiscountPct" name="specialDiscountPct" type="number" min={0} max={100} value={form.specialDiscountPct} onChange={onChange} />
            </FormField>
            <FormField label="Catatan" htmlFor="notes" className="sm:col-span-2 lg:col-span-3">
              <Textarea id="notes" name="notes" rows={2} maxLength={500} value={form.notes} onChange={onChange} />
            </FormField>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3">
          <h3 className="text-lg font-semibold tracking-tight">Coverage layanan</h3>
          <p className="text-sm text-muted-foreground">
            {selectedCount} layanan dipilih. Catatan opsional dipakai untuk pengecualian khusus paket ini, misalnya "Exc. Valuation".
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {groups.map((group) => {
            const checkedCount = group.services.filter((s) => s.id in coverage).length
            const allChecked = checkedCount === group.services.length
            return (
              <Card key={group.company} className="gap-0 py-0">
                <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                  <p className="text-sm font-semibold">{group.company}</p>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox checked={allChecked} onCheckedChange={(v) => toggleGroup(group, Boolean(v))} />
                    Semua ({checkedCount}/{group.services.length})
                  </label>
                </div>
                <div className="divide-y">
                  {group.services.map((s) => {
                    const checked = s.id in coverage
                    return (
                      <div key={s.id} className="space-y-2 px-4 py-2.5">
                        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                          <Checkbox className="mt-0.5" checked={checked} onCheckedChange={(v) => toggleService(s.id, Boolean(v))} />
                          <span className="min-w-0">
                            {s.name}
                            {s.note && <span className="block text-xs text-muted-foreground">{s.note}</span>}
                          </span>
                        </label>
                        {checked && (
                          <Input
                            className="h-8 text-xs"
                            maxLength={255}
                            placeholder="Catatan khusus paket ini (opsional)"
                            value={coverage[s.id]}
                            onChange={(e) => setCoverage((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </form>
  )
}
