import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpenText, BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, GraduationCap, History, LayoutDashboard, LogOut, ReceiptText, School, Settings, ShieldCheck, UserRound, Users2, X } from 'lucide-react'
import logo from '../assets/logo.jpeg'
import { useAuth } from '../features/auth/auth-context'
import type { AppPermission } from '../features/auth/permissions'
import { cn } from '../lib/utils'

const roleLabels = {
  admin: 'Administrador',
  director: 'Directora',
  cashier: 'Caja',
  teacher: 'Docente',
}

const navGroups: Array<{
  label: string
  items: Array<{ to: string; icon: typeof LayoutDashboard; label: string; permission: AppPermission }>
}> = [
  { label: 'Principal', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard.view' }] },
  {
    label: 'Gestión académica',
    items: [
      { to: '/alumnos', icon: GraduationCap, label: 'Alumnos', permission: 'students.view' },
      { to: '/representantes', icon: UserRound, label: 'Representantes', permission: 'guardians.view' },
      { to: '/salones', icon: School, label: 'Salones', permission: 'classrooms.view' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { to: '/mensualidades', icon: CalendarDays, label: 'Mensualidades', permission: 'tuition.view' },
      { to: '/pagos', icon: CreditCard, label: 'Pagos', permission: 'payments.view' },
      { to: '/cuentas-por-cobrar', icon: CircleDollarSign, label: 'Cuentas por cobrar', permission: 'receivables.view' },
      { to: '/gastos', icon: ReceiptText, label: 'Gastos', permission: 'expenses.view' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { to: '/empleados', icon: BriefcaseBusiness, label: 'Empleados', permission: 'employees.view' },
      { to: '/nomina', icon: BookOpenText, label: 'Nómina', permission: 'payroll.view' },
    ],
  },
  { label: 'Análisis', items: [{ to: '/reportes', icon: Users2, label: 'Reportes', permission: 'reports.view' }] },
  {
    label: 'Sistema',
    items: [
      { to: '/usuarios', icon: ShieldCheck, label: 'Usuarios y roles', permission: 'settings.view' },
      { to: '/configuracion', icon: Settings, label: 'Configuración', permission: 'settings.view' },
      { to: '/auditoria', icon: History, label: 'Auditoría', permission: 'audit.view' },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onToggleCollapse: () => void
}

export const Sidebar = ({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate()
  const { profile, can, signOut } = useAuth()

  const initials = (profile?.fullName ?? 'Usuario')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {mobileOpen ? <button type="button" aria-label="Cerrar navegacion" className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-[1px] lg:hidden" onClick={onCloseMobile} /> : null}
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-white/10 bg-primary-dark text-white transition-transform duration-200 lg:sticky lg:translate-x-0', collapsed ? 'w-[92px]' : 'w-[296px]', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-sm">
              <img src={logo} alt="Logo institucional" className="h-full w-full object-cover" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[0.14em] text-white/95">MFR</p>
                <p className="truncate text-xs text-white/55">Manuel Felipe Rugeles</p>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Colapsar sidebar" onClick={onToggleCollapse} className="focus-ring hidden h-10 w-10 items-center justify-center rounded-xl text-white/55 transition-colors duration-150 hover:bg-white/10 hover:text-white lg:inline-flex">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button type="button" aria-label="Cerrar sidebar" onClick={onCloseMobile} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/55 transition-colors duration-150 hover:bg-white/10 hover:text-white lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-6">
              {!collapsed ? <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{group.label}</p> : null}
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-2xl px-3 text-sm font-medium transition-all duration-150',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                          : 'text-white/60 hover:bg-white/6 hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={cn('absolute inset-y-2 left-0 w-1 rounded-full bg-accent transition-opacity duration-150', isActive ? 'opacity-100' : 'opacity-0')} />
                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150', isActive ? 'bg-white/10 text-white' : 'text-white/60 group-hover:bg-white/8 group-hover:text-white')}>
                          <item.icon className="h-4.5 w-4.5" />
                        </div>
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="rounded-2xl bg-white/6 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-primary-dark">{initials || 'U'}</div>
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{profile?.fullName ?? 'Usuario'}</p>
                  <p className="truncate text-xs text-white/50">{profile ? roleLabels[profile.role] : 'Sin rol'}</p>
                </div>
              ) : null}
            </div>
            {!collapsed ? (
              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                <button type="button" onClick={() => navigate('/dashboard')} className="focus-ring inline-flex flex-1 items-center justify-center rounded-xl bg-white/8 px-3 py-2 text-xs font-medium text-white/75 transition-colors duration-150 hover:bg-white/12 hover:text-white">Perfil</button>
                {can('settings.view') ? <button type="button" onClick={() => navigate('/configuracion')} className="focus-ring inline-flex flex-1 items-center justify-center rounded-xl bg-white/8 px-3 py-2 text-xs font-medium text-white/75 transition-colors duration-150 hover:bg-white/12 hover:text-white">Configuración</button> : null}
                <button type="button" aria-label="Cerrar sesión" onClick={() => void handleSignOut()} className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-white/75 transition-colors duration-150 hover:bg-white/12 hover:text-white">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  )
}






