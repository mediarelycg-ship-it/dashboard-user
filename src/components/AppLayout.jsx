import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Bot, ChevronsUpDown, LayoutDashboard, Lock, LogOut, Package, UserCheck, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { assetUrl } from '@/api/client'
import ThemeToggle from '@/components/ThemeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navGroups = [
  {
    label: 'Utama',
    items: [
      { to: '/', label: 'Beranda', icon: LayoutDashboard, roles: null },
      { to: '/profile', label: 'Profil', icon: UserCircle, roles: null },
      { to: '/agent', label: 'Agent', icon: Bot, roles: ['member'], requiresSubscription: true },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { to: '/members', label: 'Member Subscription', icon: UserCheck, roles: ['master_admin'] },
      { to: '/packages', label: 'Paket', icon: Package, roles: ['master_admin'] },
    ],
  },
]

const allItems = navGroups.flatMap((g) => g.items)

const ROLE_LABEL = { master_admin: 'Master Admin', member: 'Member' }

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'U'

function isActive(pathname, path) {
  if (path === '/') return pathname === '/'
  return pathname.startsWith(path)
}

function UserMenu() {
  const { user, logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={assetUrl(user?.picture) || undefined} alt={user?.name} referrerPolicy="no-referrer" />
                <AvatarFallback className="rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user?.role]}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild onClick={() => setOpenMobile(false)}>
              <Link to="/profile">
                <UserCircle /> Profil Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOut /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavLinks() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()

  return navGroups.map((group) => {
    const items = group.items.filter(({ roles }) => !roles || roles.includes(user?.role))
    if (items.length === 0) return null
    return (
      <SidebarGroup key={group.label}>
        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map(({ to, label, icon: Icon, requiresSubscription }) => {
              // Fitur langganan (Agent): tampil tapi nonaktif untuk member yang belum berlangganan
              if (requiresSubscription && !user?.subscribed) {
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      tooltip={`${label} (khusus member berlangganan)`}
                      data-locked="true"
                      aria-label={`${label} (terkunci, khusus member berlangganan)`}
                      className="cursor-not-allowed opacity-60 hover:bg-transparent hover:text-sidebar-foreground"
                      onClick={() => {
                        setOpenMobile(false)
                        toast.warning(`Fitur ${label} belum aktif`, {
                          description:
                            'Fitur ini hanya untuk member yang sudah berlangganan paket. Hubungi admin untuk mengaktifkan langganan Anda.',
                        })
                      }}
                    >
                      <Icon />
                      <span>{label}</span>
                      <Lock className="ml-auto size-3.5" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }
              return (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild isActive={isActive(pathname, to)} tooltip={label}>
                    <Link to={to} onClick={() => setOpenMobile(false)}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  })
}

export default function AppLayout() {
  const { user, refreshStatus } = useAuth()
  const { pathname } = useLocation()
  const isMember = user?.role === 'member'
  const fullBleed = isActive(pathname, '/agent')

  // Ambil nama/foto terbaru (mis. foto Google yang baru tersimpan di server)
  useEffect(() => {
    if (isMember) refreshStatus().catch(() => {})
  }, [isMember, refreshStatus])

  const current = allItems
    .filter((i) => isActive(pathname, i.to))
    .sort((a, b) => b.to.length - a.to.length)[0]

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <img src="/logo-r.png" alt="RELY" className="h-8 w-auto shrink-0" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">RELY Member</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">Consulting Group</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavLinks />
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium text-muted-foreground">{current?.label || 'Portal Area'}</h1>
          <ThemeToggle className="ml-auto" />
        </header>
        {/* Halaman Agent full-bleed agar daftar riwayat menempel ke sidebar */}
        <main className={cn('flex-1', !fullBleed && 'p-4 md:p-6')}>
          {fullBleed ? (
            <Outlet />
          ) : (
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
