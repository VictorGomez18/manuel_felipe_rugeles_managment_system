import { CircleDollarSign, GraduationCap, Pencil, ReceiptText, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Drawer } from '../../../components/ui/Drawer'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Tabs } from '../../../components/ui/Tabs'
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/format'
import { StudentForm } from '../components/StudentForm'
import { useStudentDetail, useStudents } from '../hooks/useStudents'
import type { StudentFormValues } from '../types'

const statusLabel = (status: 'active' | 'withdrawn' | 'graduated') =>
  status === 'active' ? 'Activo' : status === 'withdrawn' ? 'Retirado' : 'Egresado'

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mobile_payment: 'Pago móvil',
  zelle: 'Zelle',
  other: 'Otro',
}

export const StudentDetailPage = () => {
  const { id } = useParams()
  const { data, isLoading, error } = useStudentDetail(id)
  const { updateStudent, isSaving } = useStudents()
  const [activeTab, setActiveTab] = useState('summary')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const tabs = useMemo(() => {
    const detail = data
    return [
      { label: 'Resumen', value: 'summary' },
      { label: 'Mensualidades', value: 'fees', count: detail?.obligations.length ?? 0 },
      { label: 'Pagos', value: 'payments', count: detail?.payments.length ?? 0 },
      { label: 'Representantes', value: 'guardians', count: detail?.guardians.length ?? 0 },
      { label: 'Historial', value: 'history', count: detail?.history.length ?? 0 },
    ]
  }, [data])

  if (isLoading) return <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-10 text-sm text-neutral-500 shadow-xs">Cargando alumno...</div>

  if (error || !data) {
    return (
      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">Alumno no encontrado</h2>
            <p className="text-sm text-neutral-500">{error instanceof Error ? error.message : 'No existe un alumno con el identificador solicitado.'}</p>
          </div>
          <Link to="/alumnos"><Button>Volver al listado</Button></Link>
        </div>
      </Card>
    )
  }

  const student = data.student

  const handleUpdateStudent = async (values: StudentFormValues) => {
    if (!id) return
    try {
      await updateStudent({ id, values })
      setDrawerOpen(false)
      setToastMessage('Alumno actualizado correctamente.')
      window.setTimeout(() => setToastMessage(null), 2200)
    } catch (submitError) {
      setToastMessage(submitError instanceof Error ? submitError.message : 'No se pudo actualizar el alumno.')
      window.setTimeout(() => setToastMessage(null), 2200)
    }
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Ficha del estudiante"
        title={student.fullName}
        description={`${student.classroom} · ${statusLabel(student.status)}`}
        actions={<><Link to="/alumnos"><Button variant="secondary">Volver</Button></Link><Button leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>Editar</Button></>}
      />

      <Card className="overflow-hidden p-0">
        <div className="grid gap-px bg-neutral-200/80 lg:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4 bg-white px-5 py-5 sm:px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary-lighter text-xl font-semibold text-primary">{student.firstName.charAt(0)}{student.lastName.charAt(0)}</div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">{student.fullName}</p>
              <p className="mt-1 text-sm text-neutral-500">{student.document}</p>
            </div>
          </div>
          <div className="grid gap-px bg-neutral-200/80 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-white px-5 py-5 sm:px-6 lg:col-span-2">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={student.status === 'active' ? 'active' : student.status === 'withdrawn' ? 'inactive' : 'info'} label={statusLabel(student.status)} />
                <StatusBadge status="info" label={student.level} />
                <StatusBadge status="pending" label={student.classroom} />
              </div>
            </div>
            {[
              { label: 'Mensualidad', value: formatCurrency(student.monthlyFee, student.currency) },
              { label: 'Saldo pendiente', value: formatCurrency(data.financialSummary.pendingBalance, student.currency) },
              { label: 'Pagado este ano', value: formatCurrency(data.financialSummary.paidThisYear, student.currency) },
            ].map((item) => (
              <div key={item.label} className="bg-white px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">{item.label}</p>
                <p className="mt-2 text-lg font-semibold tabular-nums tracking-[-0.03em] text-neutral-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'summary' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><GraduationCap className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Datos personales</h3>
                <p className="mt-1 text-sm text-neutral-500">Informacion base del estudiante.</p>
              </div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Documento</dt><dd className="font-medium text-neutral-900">{student.document}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Fecha de nacimiento</dt><dd className="font-medium text-neutral-900">{student.birthDate ? formatDate(student.birthDate) : 'Sin fecha'}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Fecha de ingreso</dt><dd className="font-medium text-neutral-900">{student.enrollmentDate ? formatDate(student.enrollmentDate) : 'Sin fecha'}</dd></div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><UserRound className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Representante principal</h3>
                <p className="mt-1 text-sm text-neutral-500">Contacto y direccion asociados.</p>
              </div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Nombre</dt><dd className="font-medium text-neutral-900">{student.guardian}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Telefono</dt><dd className="font-medium text-neutral-900">{student.phone}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Email</dt><dd className="font-medium text-neutral-900">{student.email}</dd></div>
              <div className="flex items-start justify-between gap-4"><dt className="pt-0.5 text-neutral-500">Direccion</dt><dd className="max-w-[18rem] text-right font-medium text-neutral-900">{student.address}</dd></div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><ReceiptText className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Informacion academica</h3>
                <p className="mt-1 text-sm text-neutral-500">Ubicacion actual del alumno en la estructura del centro.</p>
              </div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Nivel</dt><dd className="font-medium text-neutral-900">{student.level}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Salon</dt><dd className="font-medium text-neutral-900">{student.classroom}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Estado</dt><dd><StatusBadge status={student.status === 'active' ? 'active' : student.status === 'withdrawn' ? 'inactive' : 'info'} label={statusLabel(student.status)} /></dd></div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><CircleDollarSign className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Resumen financiero</h3>
                <p className="mt-1 text-sm text-neutral-500">Datos reales del alumno segun sus obligaciones y pagos registrados.</p>
              </div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Mensualidad</dt><dd className="font-medium tabular-nums text-neutral-900">{formatCurrency(student.monthlyFee, student.currency)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Saldo pendiente</dt><dd className="font-medium tabular-nums text-neutral-900">{formatCurrency(data.financialSummary.pendingBalance, student.currency)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Pagado este ano</dt><dd className="font-medium tabular-nums text-neutral-900">{formatCurrency(data.financialSummary.paidThisYear, student.currency)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Proximo vencimiento</dt><dd className="font-medium text-neutral-900">{data.financialSummary.nextDueDate ? formatDate(data.financialSummary.nextDueDate) : 'Sin vencimientos pendientes'}</dd></div>
            </dl>
          </Card>
        </div>
      ) : null}

      {activeTab === 'fees' ? (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-neutral-25 text-left"><tr className="border-b border-neutral-200"><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Periodo</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Vencimiento</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Monto</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Pagado</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Saldo</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th></tr></thead>
              <tbody>{data.obligations.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No hay mensualidades registradas para este alumno.</td></tr> : data.obligations.map((item) => <tr key={item.id} className="border-b border-neutral-100/90"><td className="px-6 py-4 font-medium text-neutral-900">{item.periodLabel}</td><td className="px-6 py-4 text-neutral-700">{formatDate(item.dueDate)}</td><td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(item.amount, student.currency)}</td><td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(item.amountPaid, student.currency)}</td><td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(item.balance, student.currency)}</td><td className="px-6 py-4"><StatusBadge status={item.status === 'cancelled' ? 'cancelled' : item.status} label={item.status === 'pending' ? 'Pendiente' : item.status === 'partial' ? 'Parcial' : item.status === 'paid' ? 'Pagada' : item.status === 'overdue' ? 'Vencida' : 'Cancelada'} /></td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {activeTab === 'payments' ? (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-neutral-25 text-left"><tr className="border-b border-neutral-200"><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Recibo</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Concepto</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Fecha</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Metodo</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Monto</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Usuario</th></tr></thead>
              <tbody>{data.payments.length === 0 ? <tr><td colSpan={7} className="px-6 py-8 text-center text-neutral-500">No hay pagos registrados para este alumno.</td></tr> : data.payments.map((payment) => <tr key={payment.id} className="border-b border-neutral-100/90"><td className="px-6 py-4 font-medium text-neutral-900">{payment.receiptNumber}</td><td className="px-6 py-4 text-neutral-700">{payment.conceptName}</td><td className="px-6 py-4 text-neutral-700">{formatDate(payment.paymentDate)}</td><td className="px-6 py-4 text-neutral-700">{paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod}</td><td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(payment.amount, payment.currency)}</td><td className="px-6 py-4"><StatusBadge status={payment.status === 'active' ? 'active' : 'cancelled'} label={payment.status === 'active' ? 'Activo' : 'Anulado'} /></td><td className="px-6 py-4 text-neutral-700">{payment.registeredBy || 'Sin usuario'}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {activeTab === 'guardians' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.guardians.length === 0 ? <Card><p className="text-sm text-neutral-500">No hay representantes asociados a este alumno.</p></Card> : data.guardians.map((guardian) => <Card key={guardian.id}><div className="flex items-start justify-between gap-4"><div><h3 className="text-base font-semibold text-neutral-900">{guardian.fullName}</h3><p className="mt-1 text-sm text-neutral-500">{guardian.document}</p></div>{guardian.isPrimary ? <StatusBadge status="active" label="Principal" /> : <StatusBadge status="info" label="Secundario" />}</div><dl className="mt-5 space-y-4 text-sm"><div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Parentesco</dt><dd className="font-medium text-neutral-900">{guardian.relationship ?? 'Representante'}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Telefono</dt><dd className="font-medium text-neutral-900">{guardian.phone}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Email</dt><dd className="font-medium text-neutral-900">{guardian.email}</dd></div><div className="flex items-start justify-between gap-4"><dt className="text-neutral-500">Direccion</dt><dd className="max-w-[18rem] text-right font-medium text-neutral-900">{guardian.address}</dd></div></dl></Card>)}
        </div>
      ) : null}

      {activeTab === 'history' ? (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-neutral-25 text-left"><tr className="border-b border-neutral-200"><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Fecha</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Accion</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Entidad</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Usuario</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Notas</th></tr></thead>
              <tbody>{data.history.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No hay movimientos de auditoria para este alumno.</td></tr> : data.history.map((entry) => <tr key={entry.id} className="border-b border-neutral-100/90"><td className="px-6 py-4 text-neutral-700">{formatDateTime(entry.createdAt)}</td><td className="px-6 py-4 font-medium text-neutral-900">{entry.action}</td><td className="px-6 py-4 text-neutral-700">{entry.entity}</td><td className="px-6 py-4 text-neutral-700">{entry.userName}</td><td className="px-6 py-4 text-neutral-700">{entry.notes || 'Sin notas'}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Editar alumno"
        description="Actualiza la informacion general del alumno y su representante principal."
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancelar</Button><Button type="submit" form="student-form" isLoading={isSaving}>Guardar cambios</Button></div>}
      >
        <StudentForm
          onSubmit={handleUpdateStudent}
          initialRepresentativeId={student.guardianId ?? undefined}
          initialData={{
            firstName: student.firstName,
            lastName: student.lastName,
            document: student.document,
            birthDate: student.birthDate,
            levelId: student.levelId ?? '',
            classroomId: student.classroomId ?? '',
            monthlyFee: student.monthlyFee,
            currency: student.currency,
            enrollmentDate: student.enrollmentDate,
            representativeMode: 'existing',
          }}
        />
      </Drawer>

      {toastMessage ? <Card><p className={`text-sm ${toastMessage.includes('correctamente') ? 'text-success-dark' : 'text-danger-dark'}`}>{toastMessage}</p></Card> : null}
    </div>
  )
}

