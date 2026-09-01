import { useMemo, useState } from 'react'
import { ArrowRight, Copy, Eye, MoreHorizontal, Pencil, Plus, Search, SlidersHorizontal, UserRound, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Drawer } from '../../../components/ui/Drawer'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Select } from '../../../components/ui/Select'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Toast } from '../../../components/ui/Toast'
import { StudentForm } from '../components/StudentForm'
import { useStudents } from '../hooks/useStudents'
import type { Student, StudentFormValues } from '../types'

export const StudentsListPage = () => {
  const {
    students,
    isLoading,
    isSaving,
    isUsingMockData,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    classroomFilter,
    setClassroomFilter,
    classrooms,
    addStudent,
    updateStudent,
    totalCount,
    summary,
    hasActiveFilters,
    clearFilters,
  } = useStudents()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [openActionsId, setOpenActionsId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const navigate = useNavigate()

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'withdrawn', label: 'Retirado' },
    { value: 'graduated', label: 'Egresado' },
  ]

  const classroomOptions = useMemo(
    () => [{ value: 'all', label: 'Todos los salones' }, ...classrooms.map((classroom) => ({ value: classroom.name, label: classroom.name }))],
    [classrooms],
  )

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditingStudent(null)
  }

  const closeActions = () => setOpenActionsId(null)

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 2200)
  }

  const handleCreateStudent = async (data: StudentFormValues) => {
    try {
      await addStudent(data)
      closeDrawer()
      showToast('success', 'Alumno registrado correctamente.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo registrar el alumno.')
    }
  }

  const handleUpdateStudent = async (data: StudentFormValues) => {
    if (!editingStudent) return
    try {
      await updateStudent({ id: editingStudent.id, values: data })
      closeDrawer()
      closeActions()
      showToast('success', 'Alumno actualizado correctamente.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'No se pudo actualizar el alumno.')
    }
  }

  const openEdit = (student: Student) => {
    setEditingStudent(student)
    setDrawerOpen(true)
    closeActions()
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Gestion estudiantil"
        title="Alumnos"
        description="Gestion de estudiantes, representantes y estados administrativos con una experiencia clara y agradable de usar."
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>Nuevo alumno</Button>}
      />

      {loadError ? (
        <Card>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">No se pudieron cargar los alumnos</h2>
            <p className="text-sm text-neutral-500">{loadError}</p>
          </div>
        </Card>
      ) : null}

      {isUsingMockData ? (
        <Card>
          <p className="text-sm text-neutral-600">No fue posible sincronizar la informacion en este momento. Los datos mostrados estan disponibles para consulta.</p>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-2 gap-px bg-neutral-200/80 sm:grid-cols-4">
          {[
            { label: 'Total alumnos', value: summary.total },
            { label: 'Activos', value: summary.active },
            { label: 'Retirados', value: summary.withdrawn },
            { label: 'Egresados', value: summary.graduated },
          ].map((item, index) => (
            <div key={item.label} className={`bg-white px-5 py-4 sm:px-6 ${index === 1 ? 'sm:bg-primary-lighter/35' : ''}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-900 sm:text-[1.9rem]">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_180px_180px]">
            <Input placeholder="Buscar por nombre, documento o representante..." value={search} onChange={(event) => setSearch(event.target.value)} leftIcon={<Search className="h-4 w-4" />} className="pl-10" />
            <Select value={classroomFilter} onChange={(event) => setClassroomFilter(event.target.value)}>
              {classroomOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasActiveFilters ? <Button variant="ghost" leftIcon={<SlidersHorizontal className="h-4 w-4" />} onClick={clearFilters}>Limpiar filtros</Button> : null}
            <div className="rounded-full border border-neutral-200 bg-neutral-25 px-3.5 py-2 text-sm text-neutral-500">{totalCount} resultados</div>
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5">
            <Skeleton variant="table-row" className="h-16 w-full" />
            <Skeleton variant="table-row" className="h-16 w-full" />
            <Skeleton variant="table-row" className="h-16 w-full" />
            <Skeleton variant="table-row" className="h-16 w-full" />
          </div>
        ) : students.length === 0 ? (
          <EmptyState icon={<Users className="h-12 w-12" />} title="No hay alumnos registrados" description="Los alumnos apareceran aqui una vez que registres el primero." action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>Registrar alumno</Button>} />
        ) : (
          <>
            <div className="hidden md:block">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="sticky top-0 z-10 bg-neutral-25">
                    <tr className="border-b border-neutral-200 text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Alumno</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Representante</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Salon</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Mensualidad</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="cursor-pointer border-b border-neutral-100/90 transition-colors duration-150 hover:bg-primary-lighter/40" onClick={() => navigate(`/alumnos/${student.id}`)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-sm font-semibold text-primary">{student.firstName.charAt(0)}{student.lastName.charAt(0)}</div>
                            <div>
                              <p className="text-[15px] font-medium text-neutral-900">{student.fullName}</p>
                              <p className="mt-1 text-sm text-neutral-500">{student.document}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><p className="text-[15px] font-medium text-neutral-800">{student.guardian}</p><p className="mt-1 text-sm text-neutral-500">{student.phone}</p></td>
                        <td className="px-6 py-4 text-[15px] text-neutral-700">{student.classroom}</td>
                        <td className="px-6 py-4 text-[15px] font-medium tabular-nums text-neutral-900">{student.currency} {student.monthlyFee.toFixed(2)}</td>
                        <td className="px-6 py-4"><StatusBadge status={student.status === 'active' ? 'active' : student.status === 'withdrawn' ? 'inactive' : 'info'} label={student.status === 'active' ? 'Activo' : student.status === 'withdrawn' ? 'Retirado' : 'Egresado'} /></td>
                        <td className="px-6 py-4">
                          <div className="relative flex items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
                            <button type="button" aria-label="Ver alumno" onClick={() => navigate(`/alumnos/${student.id}`)} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-neutral-50 hover:text-primary"><Eye className="h-4 w-4" /></button>
                            <button type="button" aria-label="Mas acciones" onClick={() => setOpenActionsId((current) => current === student.id ? null : student.id)} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-neutral-50 hover:text-primary"><MoreHorizontal className="h-4 w-4" /></button>
                            {openActionsId === student.id ? (
                              <div className="absolute right-0 top-12 z-20 min-w-[220px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
                                <button type="button" onClick={() => navigate(`/alumnos/${student.id}`)} className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50"><Eye className="h-4 w-4" />Ver ficha</button>
                                <button type="button" onClick={() => openEdit(student)} className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50"><Pencil className="h-4 w-4" />Editar alumno</button>
                                {student.guardianId ? <button type="button" onClick={() => navigate(`/representantes/${student.guardianId}`)} className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50"><UserRound className="h-4 w-4" />Ver representante</button> : null}
                                <button type="button" onClick={async () => { await navigator.clipboard.writeText(student.document); closeActions(); showToast('success', 'Documento copiado al portapapeles.') }} className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50"><Copy className="h-4 w-4" />Copiar documento</button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {students.map((student) => (
                <button key={student.id} type="button" onClick={() => navigate(`/alumnos/${student.id}`)} className="focus-ring rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-xs transition-all duration-150 hover:border-primary/20 hover:bg-primary-lighter/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-sm font-semibold text-primary">{student.firstName.charAt(0)}{student.lastName.charAt(0)}</div>
                      <div>
                        <p className="text-[15px] font-medium text-neutral-900">{student.fullName}</p>
                        <p className="mt-1 text-sm text-neutral-500">{student.document}</p>
                      </div>
                    </div>
                    <StatusBadge status={student.status === 'active' ? 'active' : student.status === 'withdrawn' ? 'inactive' : 'info'} label={student.status === 'active' ? 'Activo' : student.status === 'withdrawn' ? 'Retirado' : 'Egresado'} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-neutral-400">Representante</p><p className="mt-1 font-medium text-neutral-800">{student.guardian}</p></div>
                    <div><p className="text-neutral-400">Salon</p><p className="mt-1 font-medium text-neutral-800">{student.classroom}</p></div>
                    <div><p className="text-neutral-400">Mensualidad</p><p className="mt-1 font-medium tabular-nums text-neutral-900">{student.currency} {student.monthlyFee.toFixed(2)}</p></div>
                    <div className="flex items-end justify-end"><span className="inline-flex items-center gap-1 text-sm font-medium text-primary">Ver detalle <ArrowRight className="h-4 w-4" /></span></div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingStudent ? 'Editar alumno' : 'Nuevo alumno'}
        description={editingStudent ? 'Actualiza la informacion del estudiante y su representante principal.' : 'Completa la informacion necesaria para registrar un estudiante.'}
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={closeDrawer}>Cancelar</Button><Button type="submit" form="student-form" isLoading={isSaving}>{editingStudent ? 'Guardar cambios' : 'Guardar alumno'}</Button></div>}
      >
        <StudentForm
          onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent}
          initialRepresentativeId={editingStudent?.guardianId ?? undefined}
          initialData={editingStudent ? {
            firstName: editingStudent.firstName,
            lastName: editingStudent.lastName,
            document: editingStudent.document,
            birthDate: editingStudent.birthDate,
            levelId: editingStudent.levelId ?? '',
            classroomId: editingStudent.classroomId ?? '',
            monthlyFee: editingStudent.monthlyFee,
            currency: editingStudent.currency,
            enrollmentDate: editingStudent.enrollmentDate,
            representativeMode: 'existing',
          } : undefined}
        />
      </Drawer>

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}

