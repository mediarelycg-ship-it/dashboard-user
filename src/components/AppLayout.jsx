import { LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard, end: true, roles: null },
  { to: '/members', label: 'Member Subscription', icon: Users, roles: ['master_admin'] },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const items = navItems.filter(({ roles }) => !roles || roles.includes(user?.role))

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex items-center gap-2 border-b px-6 py-5 font-semibold">
          <ShieldCheck className="size-6" />
          <span>Member Area</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={logout}>
            <LogOut />
            Keluar
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b bg-background px-4 py-3 md:hidden">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5" />
            Member Area
          </Link>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut />
            Keluar
          </Button>
        </header>

        {items.length > 1 && (
          <nav className="flex gap-2 overflow-x-auto border-b bg-background px-4 py-2 md:hidden">
            {items.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('shrink-0 rounded-md px-3 py-1.5 text-sm', isActive ? 'bg-accent font-medium' : 'text-muted-foreground')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
