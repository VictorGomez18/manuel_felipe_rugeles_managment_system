import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Wallet } from 'lucide-react'
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
import { useAuth } from '../../auth/auth-context'
import { usePayroll } from '../hooks/usePayroll'
import type { PayrollPeriodRecord } from '../types'

const periodSchema = z.object({
  employeeId: z.string().min(1, 'Selecciona un empleado'),
  periodStart: z.string().min(1, 'La fecha inicial es obligatoria'),
  periodEnd: z.string().min(1, 'La fecha final es obligatoria'),
  baseSalary: z.coerce.number().min(0, 'El salario base no puede ser negativo'),
  bonus: z.coerce.number().min(0, 'El bono no puede ser negativo'),
  deductions: z.coerce.number().min(0, 'Las deducciones no pueden ser negativas'),
  currency: z.enum(['USD', 'VES']),
  dueDate: z.string().optional(),
}).refine((value) => value.periodEnd >= value.periodStart, {
  message: 'La fecha final debe ser igual o posterior a la inicial',
  path: ['periodEnd'],
})

const paymentSchema = z.object({
  payrollPeriodId: z.string().min(1, 'Selecciona un periodo'),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  currency: z.enum(['USD', 'VES']),
  paymentMethod: z.string().min(1, 'Selecciona un metodo de pago'),
  paymentDate: z.string().min(1, 'La fecha de pago es obligatoria'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

type PeriodFormInput = z.input<typeof periodSchema>
type PeriodFormValues = z.output<typeof periodSchema>
type PaymentFormInput = z.input<typeof paymentSchema>
type PaymentFormValues = z.output<typeof paymentSchema>

const payrollStatusLabels: Record<PayrollPeriodRecord['status'], string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  overdue: 'Vencido',
}

const PeriodForm = ({ formId, employees, selectedEmployeeId, onSubmit, isSaving }: { formId: string; employees: Array<{ id: string; fullName: string; baseSalary: number; currency: 'USD' | 'VES' }>; selectedEmployeeId?: string; onSubmit: (values: PeriodFormValues) => Promise<void> | void; isSaving: boolean }) => {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PeriodFormInput, unknown, PeriodFormValues>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      employeeId: selectedEmployeeId ?? '',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      baseSalary: employees.find((item) => item.id === selectedEmployeeId)?.baseSalary ?? 0,
      bonus: 0,
      deductions: 0,
      currency: employees.find((item) => item.id === selectedEmployeeId)?.currency ?? 'USD',
      dueDate: '2026-08-31',
    },
  })

  const employeeId = useWatch({ control, name: 'employeeId' })

  useEffect(() => {
    const employee = employees.find((item) => item.id === employeeId)
    if (!employee) return
    setValue('baseSalary', employee.baseSalary)
    setValue('currency', employee.currency)
  }, [employeeId, employees, setValue])

  return (
    <form id={formId} onSubmit={handleSubmit((values) => void onSubmit(values))} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Empleado</label>
        <Select {...register('employeeId')} error={!!errors.employeeId}>
          <option value="">Selecciona un empleado</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
        </Select>
        {errors.employeeId ? <p className="mt-1.5 text-xs text-danger">{errors.employeeId.message}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Desde</label>
          <Input type="date" {...register('periodStart')} error={!!errors.periodStart} />
          {errors.periodStart ? <p className="mt-1.5 text-xs text-danger">{errors.periodStart.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Hasta</label>
          <Input type="date" {...register('periodEnd')} error={!!errors.periodEnd} />
          {errors.periodEnd ? <p className="mt-1.5 text-xs text-danger">{errors.periodEnd.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Salario base</label>
          <Input type="number" step="0.01" {...register('baseSalary')} error={!!errors.baseSalary} />
          {errors.baseSalary ? <p className="mt-1.5 text-xs text-danger">{errors.baseSalary.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Bono</label>
          <Input type="number" step="0.01" {...register('bonus')} error={!!errors.bonus} />
          {errors.bonus ? <p className="mt-1.5 text-xs text-danger">{errors.bonus.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Deducciones</label>
          <Input type="number" step="0.01" {...register('deductions')} error={!!errors.deductions} />
          {errors.deductions ? <p className="mt-1.5 text-xs text-danger">{errors.deductions.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Moneda</label>
          <Select {...register('currency')} error={!!errors.currency}>
            <option value="USD">USD</option>
            <option value="VES">VES</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Fecha limite de pago</label>
          <Input type="date" {...register('dueDate')} />
        </div>
      </div>
      <button type="submit" className="hidden" disabled={isSaving}>Submit</button>
    </form>
  )
}

const PaymentForm = ({ formId, period, methods, onSubmit, isSaving }: { formId: string; period: PayrollPeriodRecord | null; methods: Array<{ value: string; label: string }>; onSubmit: (values: PaymentFormValues) => Promise<void> | void; isSaving: boolean }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormInput, unknown, PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payrollPeriodId: period?.id ?? '',
      amount: period ? Math.max(0, period.totalAmount - period.paidAmount) : 0,
      currency: period?.currency ?? 'USD',
      paymentMethod: '',
      paymentDate: '2026-08-29',
      referenceNumber: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!period) return
    setValue('payrollPeriodId', period.id)
    setValue('amount', Math.max(0, period.totalAmount - period.paidAmount))
    setValue('currency', period.currency)
  }, [period, setValue])

  return (
    <form id={formId} onSubmit={handleSubmit((values) => void onSubmit(values))} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Periodo seleccionado</label>
        <Input value={period ? `${period.employeeName} · ${formatDate(period.periodStart)} - ${formatDate(period.periodEnd)}` : 'Sin periodo'} disabled />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Monto</label>
          <Input type="number" step="0.01" {...register('amount')} error={!!errors.amount} />
          {errors.amount ? <p className="mt-1.5 text-xs text-danger">{errors.amount.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Moneda</label>
          <Select {...register('currency')}>
            <option value="USD">USD</option>
            <option value="VES">VES</option>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Metodo</label>
          <Select {...register('paymentMethod')} error={!!errors.paymentMethod}>
            <option value="">Selecciona un metodo</option>
            {methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
          </Select>
          {errors.paymentMethod ? <p className="mt-1.5 text-xs text-danger">{errors.paymentMethod.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Fecha de pago</label>
          <Input type="date" {...register('paymentDate')} error={!!errors.paymentDate} />
          {errors.paymentDate ? <p className="mt-1.5 text-xs text-danger">{errors.paymentDate.message}</p> : null}
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Referencia</label>
          <Input {...register('referenceNumber')} placeholder="Transferencia, cheque, comprobante..." />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Notas</label>
          <textarea
            {...register('notes')}
            rows={4}
            className="focus-ring w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-[15px] text-neutral-900 shadow-xs outline-none transition-all duration-150 placeholder:text-neutral-400 hover:border-neutral-300"
            placeholder="Observaciones del pago de nomina"
          />
        </div>
      </div>
      <button type="submit" className="hidden" disabled={isSaving}>Submit</button>
    </form>
  )
}

export const PayrollPage = () => {
  const { can } = useAuth()
  const { periods, filters, setFilters, summary, employees, methods, isLoading, error, createPayrollPeriod, registerPayrollPayment, isSaving } = usePayroll()
  const [periodDrawerOpen, setPeriodDrawerOpen] = useState(false)
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriodRecord | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const periodGroups = useMemo(
    () => ({
      pending: periods.filter((item) => item.status === 'pending' || item.status === 'overdue').length,
      partial: periods.filter((item) => item.status === 'partial').length,
      paid: periods.filter((item) => item.status === 'paid').length,
    }),
    [periods],
  )

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Personal"
        title="Nomina"
        description="Control de periodos de nomina, montos causados y pagos registrados por empleado."
        actions={can('payroll.manage') ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setPeriodDrawerOpen(true)}>Nuevo periodo</Button> : undefined}
      />

      {error ? <Card><p className="text-sm text-neutral-500">{error}</p></Card> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-neutral-500">Nomina causada</p><p className="kpi-value mt-3">{formatCurrency(summary.total)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Nomina pagada</p><p className="kpi-value mt-3">{formatCurrency(summary.paid)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Saldo pendiente</p><p className="kpi-value mt-3">{formatCurrency(summary.pending)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Periodos abiertos</p><p className="kpi-value mt-3">{summary.employeesPending}</p></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[160px_160px_1fr_180px]">
          <Input type="date" value={filters.periodStart} onChange={(event) => setFilters((prev) => ({ ...prev, periodStart: event.target.value }))} />
          <Input type="date" value={filters.periodEnd} onChange={(event) => setFilters((prev) => ({ ...prev, periodEnd: event.target.value }))} />
          <Select value={filters.employee} onChange={(event) => setFilters((prev) => ({ ...prev, employee: event.target.value }))}>
            <option value="all">Todos los empleados</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
          </Select>
          <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="paid">Pagado</option>
            <option value="overdue">Vencido</option>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card><p className="text-sm text-neutral-500">Pendientes o vencidos</p><p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-900">{periodGroups.pending}</p></Card>
        <Card><p className="text-sm text-neutral-500">Parciales</p><p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-900">{periodGroups.partial}</p></Card>
        <Card><p className="text-sm text-neutral-500">Pagados</p><p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-900">{periodGroups.paid}</p></Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-25">
                <tr className="border-b border-neutral-200 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Empleado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Periodo</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Vencimiento</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Total</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Pagado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Pendiente</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => {
                  const pendingAmount = Math.max(0, period.totalAmount - period.paidAmount)
                  return (
                    <tr key={period.id} className="border-b border-neutral-100/90">
                      <td className="px-6 py-4 font-medium text-neutral-900">{period.employeeName}</td>
                      <td className="px-6 py-4 text-neutral-700">{formatDate(period.periodStart)} - {formatDate(period.periodEnd)}</td>
                      <td className="px-6 py-4 text-neutral-700">{period.dueDate ? formatDate(period.dueDate) : 'Sin fecha'}</td>
                      <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(period.totalAmount, period.currency)}</td>
                      <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(period.paidAmount, period.currency)}</td>
                      <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(pendingAmount, period.currency)}</td>
                      <td className="px-6 py-4"><StatusBadge status={period.status} label={payrollStatusLabels[period.status]} /></td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {can('payroll.manage') && pendingAmount > 0 ? (
                            <Button variant="secondary" size="sm" leftIcon={<Wallet className="h-4 w-4" />} onClick={() => { setSelectedPeriod(period); setPaymentDrawerOpen(true) }}>
                              Registrar pago
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={periodDrawerOpen}
        onClose={() => setPeriodDrawerOpen(false)}
        title="Nuevo periodo de nomina"
        description="Crea un periodo causado para un empleado activo."
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={() => setPeriodDrawerOpen(false)}>Cancelar</Button><Button type="submit" form="payroll-period-form" isLoading={isSaving}>Guardar periodo</Button></div>}
      >
        <PeriodForm
          formId="payroll-period-form"
          employees={employees}
          isSaving={isSaving}
          onSubmit={async (values) => {
            const totalAmount = Math.max(0, values.baseSalary + values.bonus - values.deductions)
            await createPayrollPeriod({
              employeeId: values.employeeId,
              periodStart: values.periodStart,
              periodEnd: values.periodEnd,
              baseSalary: values.baseSalary,
              bonus: values.bonus,
              deductions: values.deductions,
              totalAmount,
              currency: values.currency,
              dueDate: values.dueDate || null,
              status: 'pending',
            })
            setPeriodDrawerOpen(false)
            showToast('success', 'Periodo de nomina creado correctamente.')
          }}
        />
      </Drawer>

      <Drawer
        open={paymentDrawerOpen}
        onClose={() => { setPaymentDrawerOpen(false); setSelectedPeriod(null) }}
        title="Registrar pago de nomina"
        description="Registra el pago correspondiente al periodo seleccionado."
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={() => { setPaymentDrawerOpen(false); setSelectedPeriod(null) }}>Cancelar</Button><Button type="submit" form="payroll-payment-form" isLoading={isSaving}>Registrar pago</Button></div>}
      >
        <PaymentForm
          formId="payroll-payment-form"
          period={selectedPeriod}
          methods={methods}
          isSaving={isSaving}
          onSubmit={async (values) => {
            await registerPayrollPayment(values)
            setPaymentDrawerOpen(false)
            setSelectedPeriod(null)
            showToast('success', 'Pago de nomina registrado correctamente.')
          }}
        />
      </Drawer>

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}

