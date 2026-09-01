import { useState } from 'react'
import { Bell, CheckCheck, CircleDollarSign, GraduationCap, LogOut, Menu, Search, Settings2, UserCircle2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../features/auth/auth-context'

interface HeaderProps { title: string; subtitle?: string; onOpenSidebar: () => void }
const roleLabels = { admin: 'Administrador', director: 'Directora', cashier: 'Caja', teacher: 'Docente' }
const initialNotifications = [
  { id: 'payments', title: 'Cobranza pendiente', detail: 'Revisa las mensualidades con saldo vencido.', icon: CircleDollarSign, tone: 'bg-accent-light text-accent-dark', time: 'Hoy' },
  { id: 'students', title: 'Gestion estudiantil', detail: 'Consulta nuevos alumnos y sus representantes.', icon: GraduationCap, tone: 'bg-primary-lighter text-primary', time: 'Hoy' },
  { id: 'users', title: 'Usuarios del sistema', detail: 'Verifica los perfiles y permisos activos.', icon: Users, tone: 'bg-success-lighter text-success-dark', time: 'Esta semana' },
]

export const Header = ({ title, subtitle, onOpenSidebar }: HeaderProps) => {
  const navigate = useNavigate()
  const { profile, signOut, can } = useAuth()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unread, setUnread] = useState(initialNotifications.map((item) => item.id))
  const handleSignOut = async () => { await signOut(); navigate('/login', { replace: true }) }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/92 backdrop-blur">
      <div className="mx-auto flex w-full max-w-content items-center gap-4 px-4 py-4 sm:px-5 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden"><Button variant="secondary" size="sm" onClick={onOpenSidebar} leftIcon={<Menu className="h-4 w-4" />}>Menu</Button></div>
        <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-2xl">{title}</h1>{subtitle ? <p className="mt-1 hidden text-sm text-neutral-500 sm:block">{subtitle}</p> : null}</div>
        <div className="hidden min-w-[300px] max-w-[420px] flex-1 xl:block"><Input placeholder="Buscar estudiantes, representantes o modulos..." leftIcon={<Search className="h-4 w-4" />} className="pl-10" /></div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button type="button" aria-label="Notificaciones" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-800"><span className="relative"><Bell className="h-4.5 w-4.5" />{unread.length > 0 ? <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{unread.length}</span> : null}</span></button>
            {notificationsOpen ? <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.16)]"><div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4"><div><p className="font-semibold text-neutral-900">Notificaciones</p><p className="mt-0.5 text-xs text-neutral-500">{unread.length ? `${unread.length} pendientes` : 'Todo al dia'}</p></div>{unread.length ? <button type="button" onClick={() => setUnread([])} className="focus-ring inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary-lighter"><CheckCheck className="h-3.5 w-3.5" />Marcar leidas</button> : null}</div><div className="p-2">{initialNotifications.map((notification) => { const Icon = notification.icon; const isUnread = unread.includes(notification.id); return <button type="button" key={notification.id} onClick={() => setUnread((items) => items.filter((id) => id !== notification.id))} className="focus-ring flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-neutral-25"><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notification.tone}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-neutral-900">{notification.title}</span>{isUnread ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}</span><span className="mt-1 block text-xs leading-5 text-neutral-500">{notification.detail}</span><span className="mt-1.5 block text-[11px] font-medium text-neutral-400">{notification.time}</span></span></button> })}</div></div> : null}
          </div>
          {can('settings.view') ? <button type="button" aria-label="Configuracion" onClick={() => navigate('/configuracion')} className="focus-ring hidden h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-800 sm:inline-flex"><Settings2 className="h-4.5 w-4.5" /></button> : null}
          <div className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-left shadow-xs"><div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><UserCircle2 className="h-5 w-5" /></div><div className="hidden sm:block"><p className="text-sm font-medium text-neutral-900">{profile?.fullName ?? 'Usuario'}</p><p className="text-xs text-neutral-500">{profile ? roleLabels[profile.role] : 'Sin rol'}</p></div><button type="button" aria-label="Cerrar sesion" onClick={() => void handleSignOut()} className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-primary"><LogOut className="h-4 w-4" /></button></div>
        </div>
      </div>
    </header>
  )
}
