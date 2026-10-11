// Konstanta & helper paket membership (dipakai halaman paket dan detail member)

export const PACKAGE_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'corporate', label: 'Corporate' },
]

export const BILLING_PLANS = [
  { value: 'monthly', label: 'Bulanan', suffix: '/bulan', price: (p) => p.monthlyPrice },
  { value: 'promo', label: 'Promo bulanan', suffix: '/bulan', price: (p) => p.promoMonthlyPrice },
  { value: 'annual', label: 'Tahunan', suffix: '/tahun', price: (p) => p.annualPrice },
]

export const billingLabel = (value) => BILLING_PLANS.find((b) => b.value === value)?.label || '-'

export const typeLabel = (value) => PACKAGE_TYPES.find((t) => t.value === value)?.label || value

// Harga paket untuk billing plan tertentu (null jika paket tidak punya plan itu)
export function planPrice(pkg, plan) {
  const found = BILLING_PLANS.find((b) => b.value === plan)
  return found ? found.price(pkg) : null
}
