import { useState } from 'react'
import { Eye, MoreHorizontal, Plus, Search, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Drawer } from '../../../components/ui/Drawer'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Toast } from '../../../components/ui/Toast'
import { useAuth } from '../../auth/auth-context'
import { GuardianForm } from '../components/GuardianForm'
import { useGuardians } from '../hooks/useGuardians'
import type { Guardian, GuardianFormValues } from '../types'

const mapGuardianToFormValues = (guardian: Guardian): GuardianFormValues => ({
  fullName: guardian.fullName,
  document: guardian.document,
  phone: guardian.phone === 'Sin telefono' ? '' : guardian.phone,
  email: guardian.email === 'Sin email' ? '' : guardian.email,
  address: guardian.address === 'Sin direccion' ? '' : guardian.address,
  notes: guardian.notes ?? '',
  isActive: guardian.isActive,
})

export const GuardiansListPage = () => {
  const navigate = useNavigate()
  const { can } = useAuth()
  const {
    guardians,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    isLoading,
    error,
    createGuardian,
    updateGuardian,
    toggleGuardianStatus,
    isSaving,
  } = useGuardians()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setEditingGuardian(null)
  }

  const handleSubmit = async (values: GuardianFormValues) => {
    try {
      if (editingGuardian) {
        await updateGuardian({ id: editingGuardian.id, values })
        setToast({ type: 'success', message: 'Representante actualizado correctamente.' })
      } else {
        await createGuardian(values)
        setToast({ type: 'success', message: 'Representante registrado correctamente.' })
      }

      handleCloseDrawer()
    } catch (submissionError) {
      setToast({
        type: 'error',
        message: submissionError instanceof Error ? submissionError.message : 'No se pudo guardar el representante.',
      })
    } finally {
      window.setTimeout(() => setToast(null), 2200)
    }
  }

  const handleToggleStatus = async (guardian: Guardian) => {
    try {
      await toggleGuardianStatus({ id: guardian.id, isActive: !guardian.isActive })
      setToast({ type: 'success', message: guardian.isActive ? 'Representante desactivado.' : 'Representante activado.' })
    } catch (toggleError) {
      setToast({ type: 'error', message: toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar el estado.' })
    } finally {
      window.setTimeout(() => setToast(null), 2200)
    }
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Comunidad educativa"
        title="Representantes"
        description="Gestion de representantes, sus datos de contacto y la relacion con alumnos del centro."
        actions={can('guardians.create') ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>Nuevo representante</Button> : undefined}
      />

      {error ? (
        <Card>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">No se pudieron cargar los representantes</h2>
            <p className="text-sm text-neutral-500">{error}</p>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_140px]">
            <Input placeholder="Buscar por nombre, documento, telefono o email..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} leftIcon={<Search className="h-4 w-4" />} className="pl-10" />
            <div className="rounded-full border border-neutral-200 bg-neutral-25 px-3.5 py-2 text-sm text-neutral-500">
              {total} registros
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button>
            <div className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-600">
              Pagina {page} de {totalPages}
            </div>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente</Button>
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5">
            <Skeleton variant="table-row" className="h-16 w-full" />
            <Skeleton variant="table-row" className="h-16 w-full" />
            <Skeleton variant="table-row" className="h-16 w-full" />
          </div>
        ) : guardians.length === 0 ? (
          <EmptyState
            icon={<UserRound className="h-12 w-12" />}
            title="No hay representantes registrados"
            description="Los representantes apareceran aqui una vez que registres el primero."
            action={can('guardians.create') ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>Registrar representante</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-25">
                <tr className="border-b border-neutral-200 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Representante</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Contacto</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Alumnos</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Deuda</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {guardians.map((guardian) => (
                  <tr key={guardian.id} className="border-b border-neutral-100/90 transition-colors duration-150 hover:bg-primary-lighter/40">
                    <td className="px-6 py-4">
                      <button type="button" className="flex items-center gap-4 text-left" onClick={() => navigate(`/representantes/${guardian.id}`)}>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-sm font-semibold text-primary">
                          {guardian.fullName.split(' ').map((part) => part.charAt(0)).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-[15px] font-medium text-neutral-900">{guardian.fullName}</p>
                          <p className="mt-1 text-sm text-neutral-500">{guardian.document}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[15px] font-medium text-neutral-800">{guardian.phone}</p>
                      <p className="mt-1 text-sm text-neutral-500">{guardian.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[15px] font-medium text-neutral-900">{guardian.students.length}</p>
                      <p className="mt-1 text-sm text-neutral-500">{guardian.students.slice(0, 2).map((student) => student.fullName).join(', ') || 'Sin alumnos asociados'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[15px] font-semibold tabular-nums text-neutral-900">USD {guardian.debtTotal.toFixed(2)}</p>
                      <p className="mt-1 text-sm text-neutral-500">{guardian.pendingObligations} obligaciones pendientes</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={guardian.isActive ? 'active' : 'inactive'} label={guardian.isActive ? 'Activo' : 'Inactivo'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" aria-label="Ver representante" onClick={() => navigate(`/representantes/${guardian.id}`)} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-neutral-50 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </button>
                        {can('guardians.update') ? <button type="button" aria-label="Editar representante" onClick={() => { setEditingGuardian(guardian); setDrawerOpen(true) }} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-neutral-50 hover:text-primary"><MoreHorizontal className="h-4 w-4" /></button> : null}
                        {can('guardians.update') ? <Button variant="ghost" size="sm" onClick={() => void handleToggleStatus(guardian)} disabled={isSaving}>{guardian.isActive ? 'Desactivar' : 'Activar'}</Button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        title={editingGuardian ? 'Editar representante' : 'Nuevo representante'}
        description={editingGuardian ? 'Actualiza los datos del representante seleccionado.' : 'Completa la informacion del representante para integrarlo al sistema.'}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseDrawer}>Cancelar</Button>
            <Button type="submit" form="guardian-form" isLoading={isSaving}>{editingGuardian ? 'Guardar cambios' : 'Guardar representante'}</Button>
          </div>
        }
      >
        <GuardianForm onSubmit={handleSubmit} initialValues={editingGuardian ? mapGuardianToFormValues(editingGuardian) : undefined} />
      </Drawer>

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}

