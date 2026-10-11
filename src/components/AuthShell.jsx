import { CheckCircle2 } from 'lucide-react'
import Logo from '@/components/Logo'

const highlights = ['Daftar dengan email atau akun Google', 'Akses dibuka setelah disetujui master admin', 'Satu dashboard untuk semua layanan']

export default function AuthShell({ title, description, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-teal/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-primary/50 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white">
            <Logo className="h-7" />
          </div>
          <span className="text-lg font-semibold tracking-wide">RELY Consulting Goup</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-semibold">
            Member Area <span className="text-teal">RELY Consulting Group</span>
          </h2>
          <p className="mt-4 text-white/70">Kelola akun dan akses member Anda dengan mudah dan aman.</p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            {highlights.map((text) => (
              <li key={text} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-teal" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">&copy; {new Date().getFullYear()} RELY. All rights reserved.</p>
      </aside>

      <main className="flex items-center justify-center bg-card p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-8" />
            <span className="font-semibold">RELY Consulting Group Member Area</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 mb-7 text-sm text-muted-foreground">{description}</p>
          {children}
        </div>
      </main>
    </div>
  )
}
