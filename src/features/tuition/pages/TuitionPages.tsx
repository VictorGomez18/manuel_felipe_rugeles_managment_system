import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Input } from '../../../components/ui/Input'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Select } from '../../../components/ui/Select'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Toast } from '../../../components/ui/Toast'
import { useAuth } from '../../auth/auth-context'
import { useTuition } from '../hooks/useTuition'

const currency = (value: number) => `USD ${value.toFixed(2)}`

export const TuitionPage = () => {
  const { can } = useAuth()
  const { obligations, filters, setFilters, search, setSearch, classrooms, summary, isLoading, error, generateMonthlyObligations, isGenerating } = useTuition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Gestion financiera"
        title="Mensualidades"
        description="Consulta y organiza las mensualidades del periodo seleccionado."
        actions={can('tuition.generate') ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setConfirmOpen(true)}>Generar mensualidades</Button> : undefined}
      />

      {error ? <Card><p className="text-sm text-neutral-500">{error}</p></Card> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-neutral-500">Total esperado</p><p className="kpi-value mt-3">{currency(summary.expected)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Cobrado</p><p className="kpi-value mt-3">{currency(summary.collected)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Pendiente</p><p className="kpi-value mt-3">{currency(summary.pending)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Vencido</p><p className="kpi-value mt-3">{currency(summary.overdue)}</p></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_120px_120px_180px_180px]">
          <Input placeholder="Buscar por alumno..." value={search} onChange={(event) => setSearch(event.target.value)} leftIcon={<Search className="h-4 w-4" />} className="pl-10" />
          <Input type="number" value={filters.year} onChange={(event) => setFilters((prev) => ({ ...prev, year: Number(event.target.value) || prev.year }))} />
          <Select value={filters.month} onChange={(event) => setFilters((prev) => ({ ...prev, month: Number(event.target.value) }))}>
            {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </Select>
          <Select value={filters.classroom} onChange={(event) => setFilters((prev) => ({ ...prev, classroom: event.target.value }))}>
            <option value="all">Todos los salones</option>
            {classrooms.map((classroom) => <option key={classroom} value={classroom}>{classroom}</option>)}
          </Select>
          <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="paid">Pagado</option>
            <option value="overdue">Vencido</option>
            <option value="cancelled">Anulado</option>
          </Select>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-25">
                <tr className="border-b border-neutral-200 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Alumno</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Representante</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Periodo</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Monto</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Pagado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Saldo</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Vencimiento</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {obligations.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100/90">
                    <td className="px-6 py-4"><p className="font-medium text-neutral-900">{item.studentName}</p><p className="mt-1 text-sm text-neutral-500">{item.classroomName || 'Sin salon'}</p></td>
                    <td className="px-6 py-4 text-neutral-800">{item.guardianName}</td>
                    <td className="px-6 py-4 text-neutral-700">{item.periodLabel}</td>
                    <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{currency(item.amount)}</td>
                    <td className="px-6 py-4 tabular-nums text-neutral-700">{currency(item.amountPaid)}</td>
                    <td className="px-6 py-4 tabular-nums text-neutral-900">{currency(item.balance)}</td>
                    <td className="px-6 py-4 text-neutral-700">{item.dueDate}</td>
                    <td className="px-6 py-4"><StatusBadge status={item.status} label={item.status === 'pending' ? 'Pendiente' : item.status === 'partial' ? 'Parcial' : item.status === 'paid' ? 'Pagado' : item.status === 'overdue' ? 'Vencido' : 'Anulado'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void generateMonthlyObligations()
            .then(() => setToast({ type: 'success', message: 'Mensualidades generadas correctamente.' }))
            .catch((mutationError) => setToast({ type: 'error', message: mutationError instanceof Error ? mutationError.message : 'No se pudieron generar las mensualidades.' }))
            .finally(() => {
              setConfirmOpen(false)
              window.setTimeout(() => setToast(null), 2200)
            })
        }}
        isLoading={isGenerating}
        title="Generar mensualidades"
        description={`Se crearan las mensualidades correspondientes a ${filters.month}/${filters.year} para los alumnos activos.`}
        confirmLabel="Generar"
      />

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}

export const ReceivablesPage = () => {
  const { obligations, filters, setFilters, classrooms, summary, isLoading, error } = useTuition()

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader eyebrow="Finanzas" title="Cuentas por cobrar" description="Seguimiento operativo de deuda, vencimientos y representantes con saldo pendiente." />
      {error ? <Card><p className="text-sm text-neutral-500">{error}</p></Card> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-neutral-500">Deuda total</p><p className="kpi-value mt-3">{currency(summary.pending)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Vencido</p><p className="kpi-value mt-3">{currency(summary.overdue)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Por vencer</p><p className="kpi-value mt-3">{currency(summary.dueSoon)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Representantes con deuda</p><p className="kpi-value mt-3">{summary.receivableGuardians}</p></Card>
      </div>
      <Card>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[120px_120px_180px_180px]">
          <Input type="number" value={filters.year} onChange={(event) => setFilters((prev) => ({ ...prev, year: Number(event.target.value) || prev.year }))} />
          <Select value={filters.month} onChange={(event) => setFilters((prev) => ({ ...prev, month: Number(event.target.value) }))}>
            {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </Select>
          <Select value={filters.classroom} onChange={(event) => setFilters((prev) => ({ ...prev, classroom: event.target.value }))}>
            <option value="all">Todos los salones</option>
            {classrooms.map((classroom) => <option key={classroom} value={classroom}>{classroom}</option>)}
          </Select>
          <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="paid">Pagado</option>
            <option value="overdue">Vencido</option>
            <option value="cancelled">Anulado</option>
          </Select>
        </div>
      </Card>
      <Card padding="none" className="overflow-hidden">
        {isLoading ? <div className="space-y-4 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1020px] text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-25"><tr className="border-b border-neutral-200 text-left"><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Alumno</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Representante</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Periodo</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Monto</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Pagado</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Saldo</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Dias de atraso</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th></tr></thead>
              <tbody>
                {obligations.filter((item) => item.balance > 0).map((item) => {
                  const daysLate = Math.max(0, Math.floor((new Date('2026-08-29T12:00:00-04:00').getTime() - new Date(`${item.dueDate}T00:00:00`).getTime()) / 86400000))
                  return (
                    <tr key={item.id} className="border-b border-neutral-100/90">
                      <td className="px-6 py-4"><p className="font-medium text-neutral-900">{item.studentName}</p><p className="mt-1 text-sm text-neutral-500">{item.classroomName || 'Sin salon'}</p></td>
                      <td className="px-6 py-4 text-neutral-800">{item.guardianName}</td>
                      <td className="px-6 py-4 text-neutral-700">{item.periodLabel}</td>
                      <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{currency(item.amount)}</td>
                      <td className="px-6 py-4 tabular-nums text-neutral-700">{currency(item.amountPaid)}</td>
                      <td className="px-6 py-4 tabular-nums text-neutral-900">{currency(item.balance)}</td>
                      <td className="px-6 py-4 text-neutral-700">{daysLate}</td>
                      <td className="px-6 py-4"><StatusBadge status={item.status} label={item.status === 'pending' ? 'Pendiente' : item.status === 'partial' ? 'Parcial' : item.status === 'paid' ? 'Pagado' : item.status === 'overdue' ? 'Vencido' : 'Anulado'} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}


