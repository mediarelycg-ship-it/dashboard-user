import { useEffect, useState } from 'react'
import { Check, Package as PackageIcon } from 'lucide-react'
import { api } from '@/api/client'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { BILLING_PLANS, billingLabel, planPrice, typeLabel } from '@/lib/packages'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function groupCoverage(coverage = []) {
  const groups = []
  for (const item of coverage) {
    let group = groups.find((g) => g.company === item.company)
    if (!group) {
      group = { company: item.company, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

// Paket yang di-assign master admin ke member (hanya baca)
export default function MyPackageCard() {
  const [state, setState] = useState({ loading: true, pkg: null, error: '' })

  useEffect(() => {
    api
      .getMyPackage()
      .then((pkg) => setState({ loading: false, pkg, error: '' }))
      .catch((err) => setState({ loading: false, pkg: null, error: err.message }))
  }, [])

  const { loading, pkg, error } = state

  if (loading) return null

  if (!pkg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="size-5" /> Paket saya
          </CardTitle>
          <CardDescription>{error || 'Belum ada paket. Paket akan ditentukan oleh admin.'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const plan = BILLING_PLANS.find((b) => b.value === pkg.billingPlan)
  const benefits = [
    ['Advisory', `${pkg.advisoryHours} jam / bulan`],
    ['Support', pkg.support || '-'],
    ['Emergency support', pkg.emergencySupport || '-'],
    ['Loyalty points', pkg.loyaltyPointValue ? `1 poin = ${formatRupiah(pkg.loyaltyPointValue)}` : '-'],
    ['Special price', `${pkg.specialDiscountPct}% OFF`],
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <PackageIcon className="size-5" /> {pkg.name}
          <Badge variant="secondary">{typeLabel(pkg.type)}</Badge>
        </CardTitle>
        <CardDescription>
          {billingLabel(pkg.billingPlan)} · {formatRupiah(planPrice(pkg, pkg.billingPlan))}
          {plan?.suffix} (belum termasuk WHT 2%)
          {pkg.assignedAt && <> · aktif sejak {formatDateTime(pkg.assignedAt)}</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {benefits.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">Layanan yang termasuk ({pkg.coverage.length})</p>
          <div className="grid gap-4 lg:grid-cols-3">
            {groupCoverage(pkg.coverage).map((group) => (
              <div key={group.company} className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-semibold">{group.company}</p>
                <ul className="space-y-1.5 text-sm">
                  {group.items.map((item) => (
                    <li key={item.serviceId} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>
                        {item.name}
                        {[item.note, item.serviceNote].filter(Boolean).map((n) => (
                          <span key={n} className="block text-xs text-muted-foreground">{n}</span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
