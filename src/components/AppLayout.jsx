import { LayoutDashboard, LogOut, Users } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'

const navItems = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard, end: true, roles: null },
  { to: '/members', label: 'Member Subscription', icon: Users, roles: ['master_admin'] },
]

const ROLE_LABEL = { master_admin: 'Master Admin', member: 'Member' }

function Avatar({ name }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const items = navItems.filter(({ roles }) => !roles || roles.includes(user?.role))

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card md:flex">
        <Link to="/" className="flex items-center gap-3 px-6 py-6">
          <Logo className="h-8" />
          <div className="leading-tight">
            <p className="font-semibold">RELY</p>
            <p className="text-xs text-muted-foreground">Member Area</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Menu</p>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-xl bg-muted p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user?.role] || user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border bg-card py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
          >
            <LogOut className="size-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-card px-4 py-3 md:hidden">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-7" />
            RELY
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground"
          >
            <LogOut className="size-4" />
            Keluar
          </button>
        </header>

        {items.length > 1 && (
          <nav className="flex gap-2 overflow-x-auto border-b bg-card px-4 py-2 md:hidden">
            {items.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('shrink-0 rounded-lg px-3 py-1.5 text-sm', isActive ? 'bg-accent font-medium text-primary' : 'text-muted-foreground')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
