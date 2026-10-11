import { QRCodeSVG } from 'qrcode.react'
import Logo, { COMPANY_NAME } from '@/components/Logo'

// 10 digit ditampilkan berkelompok: 123 456 7890
const formatCardNumber = (value = '') => value.replace(/^(\d{3})(\d{3})(\d{0,4}).*$/, '$1 $2 $3').trim()

export default function VirtualCard({ name, cardNumber }) {
  return (
    <div className="relative aspect-[1.586/1] w-full max-w-md overflow-hidden rounded-2xl bg-navy p-6 text-white shadow-lg sm:p-7">
      <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-teal/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full bg-primary/60 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <Logo className="h-5" />
            </span>
            <span className="text-xs leading-tight font-semibold tracking-wide">{COMPANY_NAME}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="font-mono text-2xl tracking-[0.18em] sm:text-3xl">
            {cardNumber ? formatCardNumber(cardNumber) : '--- --- ----'}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          {cardNumber && (
            <div className="shrink-0 rounded-lg bg-white p-1.5">
              <QRCodeSVG value={cardNumber} size={64} level="M" aria-label={`QR code nomor kartu ${cardNumber}`} />
            </div>
          )}
          <p className="min-w-0 flex-1 truncate text-right text-base font-medium sm:text-lg">{name}</p>
        </div>
      </div>
    </div>
  )
}
