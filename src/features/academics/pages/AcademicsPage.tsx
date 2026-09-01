import { useState } from 'react'
import { BookOpenText, Plus, School } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Drawer } from '../../../components/ui/Drawer'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Toast } from '../../../components/ui/Toast'
import { useAuth } from '../../auth/auth-context'
import { ClassroomForm, LevelForm } from '../components/AcademicForms'
import { useAcademics } from '../hooks/useAcademics'
import type { ClassroomFormValues, ClassroomRecord, LevelFormValues, LevelRecord } from '../types'

const mapLevelValues = (level: LevelRecord): LevelFormValues => ({
  name: level.name,
  description: level.description ?? '',
  isActive: level.isActive,
})

const mapClassroomValues = (classroom: ClassroomRecord): ClassroomFormValues => ({
  name: classroom.name,
  levelId: classroom.levelId ?? undefined,
  turn: classroom.turn,
  teacherId: classroom.teacherId ?? undefined,
  isActive: classroom.isActive,
})

export const AcademicsPage = () => {
  const { can } = useAuth()
  const {
    levels,
    classrooms,
    teachers,
    isLoading,
    error,
    createLevel,
    updateLevel,
    toggleLevelStatus,
    createClassroom,
    updateClassroom,
    toggleClassroomStatus,
    isSaving,
  } = useAcademics()
  const [levelDrawerOpen, setLevelDrawerOpen] = useState(false)
  const [classroomDrawerOpen, setClassroomDrawerOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<LevelRecord | null>(null)
  const [editingClassroom, setEditingClassroom] = useState<ClassroomRecord | null>(null)
  const [confirmState, setConfirmState] = useState<{ type: 'level' | 'classroom'; id: string; nextState: boolean; name: string } | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const closeLevelDrawer = () => {
    setLevelDrawerOpen(false)
    setEditingLevel(null)
  }

  const closeClassroomDrawer = () => {
    setClassroomDrawerOpen(false)
    setEditingClassroom(null)
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Gestion academica"
        title="Salones y niveles"
        description="Configuracion academica base del centro con niveles, salones, turnos y asignacion docente."
        actions={can('classrooms.manage') ? (
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" leftIcon={<BookOpenText className="h-4 w-4" />} onClick={() => setLevelDrawerOpen(true)}>Nuevo nivel</Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setClassroomDrawerOpen(true)}>Nuevo salon</Button>
          </div>
        ) : undefined}
      />

      {error ? (
        <Card>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">No se pudo cargar la estructura academica</h2>
            <p className="text-sm text-neutral-500">{error}</p>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">Niveles</h3>
            <p className="mt-1 text-sm text-neutral-500">Catalogo de niveles educativos activos e historicos.</p>
          </div>
          {isLoading ? (
            <div className="space-y-4 p-5"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          ) : levels.length === 0 ? (
            <EmptyState icon={<BookOpenText className="h-12 w-12" />} title="No hay niveles registrados" description="Registra el primer nivel para estructurar salones y alumnos." action={can('classrooms.manage') ? <Button onClick={() => setLevelDrawerOpen(true)}>Registrar nivel</Button> : undefined} />
          ) : (
            <div className="divide-y divide-neutral-100">
              {levels.map((level) => (
                <div key={level.id} className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-[15px] font-medium text-neutral-900">{level.name}</p>
                      <StatusBadge status={level.isActive ? 'active' : 'inactive'} label={level.isActive ? 'Activo' : 'Inactivo'} />
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{level.description || 'Sin descripcion'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
                      <span>{level.classroomsCount} salones</span>
                      <span>{level.studentsCount} alumnos</span>
                    </div>
                  </div>
                  {can('classrooms.manage') ? (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingLevel(level); setLevelDrawerOpen(true) }}>Editar</Button>
                      <Button variant="secondary" size="sm" onClick={() => setConfirmState({ type: 'level', id: level.id, nextState: !level.isActive, name: level.name })}>{level.isActive ? 'Desactivar' : 'Activar'}</Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">Salones</h3>
            <p className="mt-1 text-sm text-neutral-500">Estructura de salones con nivel, turno, docente y cantidad de alumnos.</p>
          </div>
          {isLoading ? (
            <div className="space-y-4 p-5"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          ) : classrooms.length === 0 ? (
            <EmptyState icon={<School className="h-12 w-12" />} title="No hay salones registrados" description="Registra el primer salon para organizar asignaciones academicas." action={can('classrooms.manage') ? <Button onClick={() => setClassroomDrawerOpen(true)}>Registrar salon</Button> : undefined} />
          ) : (
            <div className="divide-y divide-neutral-100">
              {classrooms.map((classroom) => (
                <div key={classroom.id} className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-[15px] font-medium text-neutral-900">{classroom.name}</p>
                      <StatusBadge status={classroom.isActive ? 'active' : 'inactive'} label={classroom.isActive ? 'Activo' : 'Inactivo'} />
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{classroom.levelName || 'Sin nivel'} · {classroom.turn === 'morning' ? 'Manana' : classroom.turn === 'afternoon' ? 'Tarde' : 'Ambos'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
                      <span>{classroom.teacherName || 'Sin docente asignado'}</span>
                      <span>{classroom.studentsCount} alumnos</span>
                    </div>
                  </div>
                  {can('classrooms.manage') ? (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingClassroom(classroom); setClassroomDrawerOpen(true) }}>Editar</Button>
                      <Button variant="secondary" size="sm" onClick={() => setConfirmState({ type: 'classroom', id: classroom.id, nextState: !classroom.isActive, name: classroom.name })}>{classroom.isActive ? 'Desactivar' : 'Activar'}</Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Drawer
        open={levelDrawerOpen}
        onClose={closeLevelDrawer}
        title={editingLevel ? 'Editar nivel' : 'Nuevo nivel'}
        description={editingLevel ? 'Actualiza la informacion del nivel seleccionado.' : 'Completa la informacion del nivel educativo.'}
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={closeLevelDrawer}>Cancelar</Button><Button type="submit" form="level-form" isLoading={isSaving}>{editingLevel ? 'Guardar cambios' : 'Guardar nivel'}</Button></div>}
      >
        <LevelForm
          onSubmit={async (values) => {
            try {
              if (editingLevel) {
                await updateLevel({ id: editingLevel.id, values })
                showToast('success', 'Nivel actualizado correctamente.')
              } else {
                await createLevel(values)
                showToast('success', 'Nivel registrado correctamente.')
              }
              closeLevelDrawer()
            } catch (formError) {
              showToast('error', formError instanceof Error ? formError.message : 'No se pudo guardar el nivel.')
            }
          }}
          initialValues={editingLevel ? mapLevelValues(editingLevel) : undefined}
        />
      </Drawer>

      <Drawer
        open={classroomDrawerOpen}
        onClose={closeClassroomDrawer}
        title={editingClassroom ? 'Editar salon' : 'Nuevo salon'}
        description={editingClassroom ? 'Actualiza la informacion del salon seleccionado.' : 'Completa la informacion del salon.'}
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={closeClassroomDrawer}>Cancelar</Button><Button type="submit" form="classroom-form" isLoading={isSaving}>{editingClassroom ? 'Guardar cambios' : 'Guardar salon'}</Button></div>}
      >
        <ClassroomForm
          levels={levels}
          teachers={teachers}
          onSubmit={async (values) => {
            try {
              if (editingClassroom) {
                await updateClassroom({ id: editingClassroom.id, values })
                showToast('success', 'Salon actualizado correctamente.')
              } else {
                await createClassroom(values)
                showToast('success', 'Salon registrado correctamente.')
              }
              closeClassroomDrawer()
            } catch (formError) {
              showToast('error', formError instanceof Error ? formError.message : 'No se pudo guardar el salon.')
            }
          }}
          initialValues={editingClassroom ? mapClassroomValues(editingClassroom) : undefined}
        />
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmState)}
        onClose={() => setConfirmState(null)}
        onConfirm={() => {
          if (!confirmState) return

          const action = confirmState.type === 'level'
            ? toggleLevelStatus({ id: confirmState.id, isActive: confirmState.nextState })
            : toggleClassroomStatus({ id: confirmState.id, isActive: confirmState.nextState })

          void action
            .then(() => showToast('success', `${confirmState.type === 'level' ? 'Nivel' : 'Salon'} ${confirmState.nextState ? 'activado' : 'desactivado'} correctamente.`))
            .catch((dialogError) => showToast('error', dialogError instanceof Error ? dialogError.message : 'No se pudo actualizar el estado.'))
            .finally(() => setConfirmState(null))
        }}
        tone="danger"
        isLoading={isSaving}
        title={confirmState?.nextState ? 'Confirmar activacion' : 'Confirmar desactivacion'}
        description={confirmState ? `Vas a ${confirmState.nextState ? 'activar' : 'desactivar'} ${confirmState.type === 'level' ? 'el nivel' : 'el salon'} ${confirmState.name}.` : ''}
        confirmLabel={confirmState?.nextState ? 'Activar' : 'Desactivar'}
      />

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}

