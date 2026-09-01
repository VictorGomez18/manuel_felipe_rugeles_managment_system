import { useEffect, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Search, ShieldCheck, Users2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Drawer } from '../../../components/ui/Drawer'
import { Input } from '../../../components/ui/Input'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Select } from '../../../components/ui/Select'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Toast } from '../../../components/ui/Toast'
import { formatDateTime } from '../../../lib/format'
import { useAuth } from '../../auth/auth-context'
import type { AppRole } from '../../auth/permissions'
import { useUsers } from '../hooks/useUsers'
import type { AppUserRecord } from '../types'

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  director: 'Directora',
  cashier: 'Caja',
  teacher: 'Docente',
}

const userSchema = z.object({
  fullName: z.string().min(3, 'El nombre es obligatorio'),
  role: z.enum(['admin', 'director', 'cashier', 'teacher']),
  phone: z.string().optional(),
  isActive: z.enum(['true', 'false']),
})

type UserFormValues = z.input<typeof userSchema>

export const UsersPage = () => {
  const { can, profile } = useAuth()
  const { users, search, setSearch, role, setRole, status, setStatus, summary, isLoading, error, saveUser, isSaving, createUser, isCreating } = useUsers()
  const [editingUser, setEditingUser] = useState<AppUserRecord | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'teacher' as AppRole, phone: '' })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '',
      role: 'teacher',
      phone: '',
      isActive: 'true',
    },
  })

  useEffect(() => {
    if (!editingUser) return
    reset({
      fullName: editingUser.fullName,
      role: editingUser.role,
      phone: editingUser.phone ?? '',
      isActive: editingUser.isActive ? 'true' : 'false',
    })
  }, [editingUser, reset])

  const closeDrawer = () => {
    setEditingUser(null)
    reset({ fullName: '', role: 'teacher', phone: '', isActive: 'true' })
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Sistema"
        title="Usuarios y roles"
        description="Gestion de perfiles, roles operativos y estado de acceso."
        actions={profile?.role === 'admin' ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Nuevo usuario</Button> : undefined}
      />

      {error ? <Card><p className="text-sm text-neutral-500">{error}</p></Card> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-neutral-500">Usuarios cargados</p><p className="kpi-value mt-3">{summary.total}</p></Card>
        <Card><p className="text-sm text-neutral-500">Usuarios activos</p><p className="kpi-value mt-3">{summary.active}</p></Card>
        <Card><p className="text-sm text-neutral-500">Admins y direccion</p><p className="kpi-value mt-3">{summary.admins}</p></Card>
        <Card><p className="text-sm text-neutral-500">Docentes</p><p className="kpi-value mt-3">{summary.teachers}</p></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_180px_180px]">
          <Input placeholder="Buscar por nombre o telefono..." value={search} onChange={(event) => setSearch(event.target.value)} leftIcon={<Search className="h-4 w-4" />} className="pl-10" />
          <Select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="director">Directora</option>
            <option value="cashier">Caja</option>
            <option value="teacher">Docente</option>
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </Select>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-25">
                <tr className="border-b border-neutral-200 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Usuario</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Rol</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Telefono</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Actualizado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100/90">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-neutral-900">{user.fullName}</p>
                        <p className="mt-1 text-xs text-neutral-500">{user.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-700">{roleLabels[user.role]}</td>
                    <td className="px-6 py-4 text-neutral-700">{user.phone || 'Sin telefono'}</td>
                    <td className="px-6 py-4"><StatusBadge status={user.isActive ? 'active' : 'inactive'} label={user.isActive ? 'Activo' : 'Inactivo'} /></td>
                    <td className="px-6 py-4 text-neutral-700">{user.updatedAt ? formatDateTime(user.updatedAt) : 'Sin registro'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {can('settings.update') ? <Button variant="secondary" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditingUser(user)}>Editar</Button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Control de acceso</h3>
              <p className="mt-1 text-sm text-neutral-500">El rol del perfil controla los permisos visibles en dashboard, finanzas, personal, reportes y sistema.</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-light text-accent-dark"><Users2 className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Administracion de usuarios</h3>
              <p className="mt-1 text-sm text-neutral-500">Administra las cuentas, los roles y el estado de acceso del personal autorizado.</p>
            </div>
          </div>
        </Card>
      </div>

      <Drawer
        open={Boolean(editingUser)}
        onClose={closeDrawer}
        title="Editar usuario"
        description="Actualiza nombre, telefono, rol operativo y estado del perfil."
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={closeDrawer}>Cancelar</Button><Button type="submit" form="user-form" isLoading={isSaving}>Guardar cambios</Button></div>}
      >
        <form
          id="user-form"
          onSubmit={handleSubmit(async (values) => {
            if (!editingUser) return
            try {
              const parsed = userSchema.parse(values)
              await saveUser({
                id: editingUser.id,
                values: {
                  fullName: parsed.fullName,
                  role: parsed.role,
                  phone: parsed.phone,
                  isActive: parsed.isActive === 'true',
                },
              })
              setToast({ type: 'success', message: 'Usuario actualizado correctamente.' })
              closeDrawer()
            } catch (submitError) {
              setToast({ type: 'error', message: submitError instanceof Error ? submitError.message : 'No se pudo actualizar el usuario.' })
            } finally {
              window.setTimeout(() => setToast(null), 2200)
            }
          })}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nombre completo</label>
            <Input {...register('fullName')} error={!!errors.fullName} />
            {errors.fullName ? <p className="mt-1.5 text-xs text-danger">{errors.fullName.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Rol</label>
            <Select {...register('role')} error={!!errors.role}>
              <option value="admin">Administrador</option>
              <option value="director">Directora</option>
              <option value="cashier">Caja</option>
              <option value="teacher">Docente</option>
            </Select>
            {errors.role ? <p className="mt-1.5 text-xs text-danger">{errors.role.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Telefono</label>
            <Input {...register('phone')} placeholder="Opcional" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Estado</label>
            <Select {...register('isActive')}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear usuario"
        description="La cuenta quedara activa con el rol seleccionado. Comparte la contrasena temporal por un canal seguro."
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" form="create-user-form" isLoading={isCreating}>Crear usuario</Button></div>}
      >
        <form id="create-user-form" className="space-y-4" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          try {
            await createUser(newUser)
            setToast({ type: 'success', message: 'Usuario creado correctamente.' })
            setCreateOpen(false)
            setNewUser({ fullName: '', email: '', password: '', role: 'teacher', phone: '' })
          } catch (createError) {
            setToast({ type: 'error', message: createError instanceof Error ? createError.message : 'No se pudo crear el usuario.' })
          } finally {
            window.setTimeout(() => setToast(null), 3200)
          }
        }}>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Nombre completo</label><Input required value={newUser.fullName} onChange={(event) => setNewUser((value) => ({ ...value, fullName: event.target.value }))} placeholder="Nombre y apellido" /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Correo electronico</label><Input required type="email" value={newUser.email} onChange={(event) => setNewUser((value) => ({ ...value, email: event.target.value }))} placeholder="correo@institucion.edu" /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Contrasena temporal</label><Input required type="password" minLength={8} value={newUser.password} onChange={(event) => setNewUser((value) => ({ ...value, password: event.target.value }))} placeholder="Minimo 8 caracteres" /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Rol</label><Select value={newUser.role} onChange={(event) => setNewUser((value) => ({ ...value, role: event.target.value as AppRole }))}><option value="director">Directora</option><option value="cashier">Caja</option><option value="teacher">Docente</option></Select></div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Telefono</label><Input value={newUser.phone} onChange={(event) => setNewUser((value) => ({ ...value, phone: event.target.value }))} placeholder="Opcional" /></div>
        </form>
      </Drawer>
      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}



