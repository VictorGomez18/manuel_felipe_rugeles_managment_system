import { CalendarClock, CircleDollarSign, ReceiptText, UserRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useGuardianDetail } from '../hooks/useGuardians'

export const GuardianDetailPage = () => {
  const { id } = useParams()
  const { data: guardian, isLoading, error } = useGuardianDetail(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !guardian) {
    return (
      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">Representante no encontrado</h2>
            <p className="text-sm text-neutral-500">{error instanceof Error ? error.message : 'No existe un representante con el identificador solicitado.'}</p>
          </div>
          <Link to="/representantes"><Button>Volver al listado</Button></Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Ficha del representante"
        title={guardian.fullName}
        description={`${guardian.students.length} alumnos asociados · ${guardian.isActive ? 'Activo' : 'Inactivo'}`}
        actions={<Link to="/representantes"><Button variant="secondary">Volver</Button></Link>}
      />

      <Card className="overflow-hidden p-0">
        <div className="grid gap-px bg-neutral-200/80 lg:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4 bg-white px-5 py-5 sm:px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary-lighter text-xl font-semibold text-primary">
              {guardian.fullName.split(' ').map((part) => part.charAt(0)).slice(0, 2).join('')}
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">{guardian.fullName}</p>
              <p className="mt-1 text-sm text-neutral-500">{guardian.document}</p>
            </div>
          </div>
          <div className="grid gap-px bg-neutral-200/80 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white px-5 py-5 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={guardian.isActive ? 'active' : 'inactive'} label={guardian.isActive ? 'Activo' : 'Inactivo'} />
              </div>
            </div>
            {[
              { label: 'Deuda consolidada', value: `USD ${guardian.debtTotal.toFixed(2)}` },
              { label: 'Obligaciones pendientes', value: String(guardian.pendingObligations) },
              { label: 'Pagos recientes', value: String(guardian.recentPayments) },
            ].map((item) => (
              <div key={item.label} className="bg-white px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">{item.label}</p>
                <p className="mt-2 text-lg font-semibold tabular-nums tracking-[-0.03em] text-neutral-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><UserRound className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Datos personales</h3>
              <p className="mt-1 text-sm text-neutral-500">Información base del representante.</p>
            </div>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Teléfono</dt><dd className="font-medium text-neutral-900">{guardian.phone}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Email</dt><dd className="font-medium text-neutral-900">{guardian.email}</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="pt-0.5 text-neutral-500">Dirección</dt><dd className="max-w-[18rem] text-right font-medium text-neutral-900">{guardian.address}</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="pt-0.5 text-neutral-500">Notas</dt><dd className="max-w-[18rem] text-right font-medium text-neutral-900">{guardian.notes || 'Sin notas'}</dd></div>
          </dl>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><ReceiptText className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Alumnos asociados</h3>
              <p className="mt-1 text-sm text-neutral-500">Relacion activa del representante con alumnos del centro.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {guardian.students.length > 0 ? guardian.students.map((student) => (
              <Link key={student.id} to={`/alumnos/${student.id}`} className="block rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 transition-colors duration-150 hover:border-primary/15 hover:bg-primary-lighter/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{student.fullName}</p>
                    <p className="mt-1 text-sm text-neutral-500">{student.classroom || 'Sin salón asignado'}</p>
                  </div>
                  <StatusBadge status={student.status === 'active' ? 'active' : student.status === 'withdrawn' ? 'inactive' : 'info'} label={student.status === 'active' ? 'Activo' : student.status === 'withdrawn' ? 'Retirado' : 'Egresado'} />
                </div>
              </Link>
            )) : <p className="text-sm text-neutral-500">No hay alumnos asociados a este representante.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><CircleDollarSign className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Resumen financiero</h3>
              <p className="mt-1 text-sm text-neutral-500">Consolidado de deuda y obligaciones asociadas.</p>
            </div>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Deuda total</dt><dd className="font-medium tabular-nums text-neutral-900">USD {guardian.debtTotal.toFixed(2)}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Obligaciones pendientes</dt><dd className="font-medium text-neutral-900">{guardian.pendingObligations}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Pagos recientes</dt><dd className="font-medium text-neutral-900">{guardian.recentPayments}</dd></div>
          </dl>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><CalendarClock className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Seguimiento</h3>
              <p className="mt-1 text-sm text-neutral-500">Indicadores utiles para gestion y cobranza.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado general</p>
              <p className="mt-2 text-sm text-neutral-900">{guardian.isActive ? 'Puede participar en procesos administrativos y de cobranza.' : 'Se encuentra inactivo y no deberia usarse como representante principal nuevo.'}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Relacion con alumnos</p>
              <p className="mt-2 text-sm text-neutral-900">{guardian.students.length > 0 ? `${guardian.students.length} alumnos vinculados actualmente.` : 'No tiene alumnos vinculados.'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


