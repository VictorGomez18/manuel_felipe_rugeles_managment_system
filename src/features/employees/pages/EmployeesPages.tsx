import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Drawer } from '../../../components/ui/Drawer'
import { Input } from '../../../components/ui/Input'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Select } from '../../../components/ui/Select'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Toast } from '../../../components/ui/Toast'
import { formatCurrency, formatDate } from '../../../lib/format'
import { useEmployees, useEmployeeDetail } from '../hooks/useEmployees'

const roleLabels: Record<string, string> = {
  teacher: 'Docente',
  assistant: 'Auxiliar',
  director: 'Directora',
  admin: 'Administrativo',
  cleaning: 'Limpieza',
  kitchen: 'Cocina',
  other: 'Otro',
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

const payrollStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  overdue: 'Vencido',
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mobile_payment: 'Pago móvil',
  zelle: 'Zelle',
  other: 'Otro',
}

export const EmployeesPage = () => {
  const { employees, totalPages, page, setPage, search, setSearch, summary, isLoading, error, saveEmployee, toggleEmployeeStatus, isSaving } = useEmployees()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const employee = employees.find((item) => item.id === editingId) ?? null

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Personal"
        title="Empleados"
        description="Gestión operativa del personal del centro, salarios base y frecuencia de nómina."
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>Nuevo empleado</Button>}
      />

      {error ? <Card><p className="text-sm text-neutral-500">{error}</p></Card> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-neutral-500">Activos</p><p className="kpi-value mt-3">{summary.active}</p></Card>
        <Card><p className="text-sm text-neutral-500">Docentes</p><p className="kpi-value mt-3">{summary.teachers}</p></Card>
        <Card><p className="text-sm text-neutral-500">Administrativos</p><p className="kpi-value mt-3">{summary.admins}</p></Card>
        <Card><p className="text-sm text-neutral-500">Nómina estimada</p><p className="kpi-value mt-3">{formatCurrency(summary.payrollEstimate)}</p></Card>
      </div>

      <Card>
        <Input
          placeholder="Buscar por nombre, documento o teléfono..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          leftIcon={<Search className="h-4 w-4" />}
          className="max-w-md pl-10"
        />
      </Card>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1060px] text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-25">
                <tr className="border-b border-neutral-200 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Nombre</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Documento</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Teléfono</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Cargo</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Ingreso</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Salario</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Frecuencia</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100/90">
                    <td className="px-6 py-4"><Link to={`/empleados/${item.id}`} className="font-medium text-neutral-900 hover:text-primary">{item.fullName}</Link></td>
                    <td className="px-6 py-4 text-neutral-700">{item.document}</td>
                    <td className="px-6 py-4 text-neutral-700">{item.phone}</td>
                    <td className="px-6 py-4 text-neutral-700">{roleLabels[item.role] ?? item.role}</td>
                    <td className="px-6 py-4 text-neutral-700">{item.hireDate ? formatDate(item.hireDate) : 'Sin fecha'}</td>
                    <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(item.baseSalary, item.currency)}</td>
                    <td className="px-6 py-4 text-neutral-700">{frequencyLabels[item.payrollFrequency] ?? item.payrollFrequency}</td>
                    <td className="px-6 py-4"><StatusBadge status={item.status === 'active' ? 'active' : 'inactive'} label={item.status === 'active' ? 'Activo' : 'Inactivo'} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setDrawerOpen(true) }}>Editar</Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            void toggleEmployeeStatus({ id: item.id, status: item.status === 'active' ? 'inactive' : 'active' })
                              .then(() => showToast('success', 'Estado actualizado correctamente.'))
                              .catch((toggleError) => showToast('error', toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar el empleado.'))
                          }
                        >
                          {item.status === 'active' ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button>
        <div className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-600">Página {page} de {totalPages}</div>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente</Button>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingId(null) }}
        title={employee ? 'Editar empleado' : 'Nuevo empleado'}
        description="Gestióna datos personales y laborales del personal del centro."
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={() => { setDrawerOpen(false); setEditingId(null) }}>Cancelar</Button><Button type="submit" form="employee-form" isLoading={isSaving}>{employee ? 'Guardar cambios' : 'Guardar empleado'}</Button></div>}
      >
        <form
          id="employee-form"
          onSubmit={(event) => {
            event.preventDefault(); if (!event.currentTarget.reportValidity()) return
            const formData = new FormData(event.currentTarget)
            const values = {
              fullName: String(formData.get('fullName') || ''),
              document: String(formData.get('document') || ''),
              phone: String(formData.get('phone') || ''),
              role: String(formData.get('role') || 'other'),
              hireDate: String(formData.get('hireDate') || ''),
              baseSalary: Number(formData.get('baseSalary') || 0),
              currency: String(formData.get('currency') || 'USD') as 'USD' | 'VES',
              payrollFrequency: String(formData.get('payrollFrequency') || 'monthly'),
              status: String(formData.get('status') || 'active') as 'active' | 'inactive',
              notes: String(formData.get('notes') || ''),
            }

            void saveEmployee({ id: employee?.id, values })
              .then(() => {
                showToast('success', employee ? 'Empleado actualizado correctamente.' : 'Empleado registrado correctamente.')
                setDrawerOpen(false)
                setEditingId(null)
              })
              .catch((submitError) => showToast('error', submitError instanceof Error ? submitError.message : 'No se pudo guardar el empleado.'))
          }}
          className="space-y-3"
        >
          <Input required minLength={3} name="fullName" defaultValue={employee?.fullName || ''} placeholder="Nombre completo" />
          <Input required pattern="[VEJGPvejpg]-?[0-9]{5,10}" name="document" defaultValue={employee?.document || ''} placeholder="Documento" />
          <Input required inputMode="numeric" pattern="0?[0-9]{10,11}" name="phone" defaultValue={employee?.phone || ''} placeholder="Teléfono" />
          <Select name="role" defaultValue={employee?.role || 'teacher'}>
            <option value="teacher">Docente</option>
            <option value="assistant">Auxiliar</option>
            <option value="director">Directora</option>
            <option value="admin">Administrativo</option>
            <option value="cleaning">Limpieza</option>
            <option value="kitchen">Cocina</option>
            <option value="other">Otro</option>
          </Select>
          <Input name="hireDate" type="date" required defaultValue={employee?.hireDate || ''} />
          <Input name="baseSalary" type="number" required min="0" step="0.01" defaultValue={employee?.baseSalary || ''} placeholder="Salario base" />
          <Select name="currency" defaultValue={employee?.currency || 'USD'}>
            <option value="USD">USD</option>
            <option value="VES">VES</option>
          </Select>
          <Select name="payrollFrequency" defaultValue={employee?.payrollFrequency || 'monthly'}>
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quincenal</option>
            <option value="monthly">Mensual</option>
          </Select>
          <Select name="status" defaultValue={employee?.status || 'active'}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </Select>
          <Input name="notes" defaultValue={employee?.notes || ''} placeholder="Notas" />
        </form>
      </Drawer>

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}

export const EmployeeDetailPage = () => {
  const { id } = useParams()
  const { data, isLoading, error } = useEmployeeDetail(id)

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (error || !data) return <Card><p className="text-sm text-neutral-500">{error instanceof Error ? error.message : 'No se pudo cargar el empleado.'}</p></Card>

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Personal"
        title={data.employee.fullName}
        description={`${roleLabels[data.employee.role] ?? data.employee.role} · ${data.employee.status === 'active' ? 'Activo' : 'Inactivo'}`}
        actions={<Link to="/empleados"><Button variant="secondary">Volver</Button></Link>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-neutral-900">Información personal</h3>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Documento</dt><dd className="font-medium text-neutral-900">{data.employee.document}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Teléfono</dt><dd className="font-medium text-neutral-900">{data.employee.phone}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Cargo</dt><dd className="font-medium text-neutral-900">{roleLabels[data.employee.role] ?? data.employee.role}</dd></div>
          </dl>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-neutral-900">Información laboral</h3>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Ingreso</dt><dd className="font-medium text-neutral-900">{data.employee.hireDate ? formatDate(data.employee.hireDate) : 'Sin fecha'}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Salario base</dt><dd className="font-medium text-neutral-900">{formatCurrency(data.employee.baseSalary, data.employee.currency)}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-neutral-500">Frecuencia</dt><dd className="font-medium text-neutral-900">{frequencyLabels[data.employee.payrollFrequency] ?? data.employee.payrollFrequency}</dd></div>
          </dl>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h3 className="text-base font-semibold text-neutral-900">Historial de nómina</h3>
          <p className="mt-1 text-sm text-neutral-500">Periodos causados para este empleado.</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-neutral-25 text-left">
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Periodo</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Vencimiento</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Monto</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.payrollHistory.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-neutral-500">No hay periodos de nómina registrados.</td></tr>
              ) : (
                data.payrollHistory.map((period) => (
                  <tr key={period.id} className="border-b border-neutral-100/90">
                    <td className="px-6 py-4 font-medium text-neutral-900">{formatDate(period.period_start)} - {formatDate(period.period_end)}</td>
                    <td className="px-6 py-4 text-neutral-700">{period.due_date ? formatDate(period.due_date) : 'Sin fecha'}</td>
                    <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(Number(period.total_amount ?? 0), data.employee.currency)}</td>
                    <td className="px-6 py-4"><StatusBadge status={period.status} label={payrollStatusLabels[period.status] ?? period.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h3 className="text-base font-semibold text-neutral-900">Pagos de nómina</h3>
          <p className="mt-1 text-sm text-neutral-500">Movimientos asociados a sus periodos de pago.</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-neutral-25 text-left">
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Periodo</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Método</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Referencia</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No hay pagos de nómina registrados.</td></tr>
              ) : (
                data.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-neutral-100/90">
                    <td className="px-6 py-4 text-neutral-700">{formatDate(payment.payment_date)}</td>
                    <td className="px-6 py-4 font-medium text-neutral-900">{formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}</td>
                    <td className="px-6 py-4 text-neutral-700">{paymentMethodLabels[payment.payment_method] ?? payment.payment_method}</td>
                    <td className="px-6 py-4 text-neutral-700">{payment.reference_number || 'Sin referencia'}</td>
                    <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(Number(payment.amount ?? 0), data.employee.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}




