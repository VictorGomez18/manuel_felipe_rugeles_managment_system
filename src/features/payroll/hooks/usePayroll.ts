import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { PayrollPeriodRecord } from '../types'

const payrollMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mobile_payment: 'Pago móvil',
  zelle: 'Zelle',
  other: 'Otro',
}

const payrollKeys = {
  all: ['payroll'] as const,
  list: (filters: Record<string, string>) => [...payrollKeys.all, filters] as const,
  catalog: () => [...payrollKeys.all, 'catalog'] as const,
}

type PayrollRow = {
  id: string
  employee_id: string
  period_start: string
  period_end: string
  base_salary: number | string
  bonus: number | string
  deductions: number | string
  total_amount: number | string
  currency: 'USD' | 'VES'
  due_date?: string | null
  status: PayrollPeriodRecord['status']
  employees?: { full_name: string } | { full_name: string }[] | null
  payroll_payments?: Array<{ amount: number | string }> | null
}

const mapPayroll = (row: PayrollRow): PayrollPeriodRecord => {
  const employee = Array.isArray(row.employees) ? row.employees[0] : row.employees
  const paidAmount = (row.payroll_payments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)

  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: employee?.full_name ?? 'Empleado sin nombre',
    periodStart: row.period_start,
    periodEnd: row.period_end,
    baseSalary: Number(row.base_salary ?? 0),
    bonus: Number(row.bonus ?? 0),
    deductions: Number(row.deductions ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    currency: row.currency,
    dueDate: row.due_date,
    status: row.status,
    paidAmount,
  }
}

const fetchPayroll = async (filters: Record<string, string>) => {
  if (!supabase) return [] as PayrollPeriodRecord[]

  let query = supabase
    .from('payroll_periods')
    .select('id, employee_id, period_start, period_end, base_salary, bonus, deductions, total_amount, currency, due_date, status, employees ( full_name ), payroll_payments ( amount )')
    .order('period_start', { ascending: false })

  if (filters.employee !== 'all') query = query.eq('employee_id', filters.employee)
  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.periodStart) query = query.gte('period_start', filters.periodStart)
  if (filters.periodEnd) query = query.lte('period_end', filters.periodEnd)

  const { data, error } = await query
  if (error) throw new Error('No se pudo cargar la nómina.')

  return ((data ?? []) as PayrollRow[]).map(mapPayroll)
}

const fetchCatalog = async () => {
  if (!supabase) {
    return {
      employees: [] as Array<{ id: string; fullName: string; baseSalary: number; currency: 'USD' | 'VES' }>,
      methods: Object.entries(payrollMethodLabels).map(([value, label]) => ({ value, label })),
    }
  }

  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, base_salary, currency')
    .eq('status', 'active')
    .order('full_name')

  if (error) throw new Error('No se pudo cargar el catalogo de empleados para nómina.')

  return {
    employees: (data ?? []).map((employee) => ({
      id: employee.id,
      fullName: employee.full_name,
      baseSalary: Number(employee.base_salary ?? 0),
      currency: employee.currency as 'USD' | 'VES',
    })),
    methods: Object.entries(payrollMethodLabels).map(([value, label]) => ({ value, label })),
  }
}

const createPayrollPeriod = async (values: Omit<PayrollPeriodRecord, 'id' | 'employeeName' | 'paidAmount'>) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')

  const { error } = await supabase.from('payroll_periods').insert({
    employee_id: values.employeeId,
    period_start: values.periodStart,
    period_end: values.periodEnd,
    base_salary: values.baseSalary,
    bonus: values.bonus,
    deductions: values.deductions,
    total_amount: values.totalAmount,
    currency: values.currency,
    due_date: values.dueDate || null,
    status: values.status,
  })

  if (error) throw new Error('No se pudo crear el periodo de nómina.')
}

const registerPayrollPayment = async ({ payrollPeriodId, amount, currency, paymentMethod, referenceNumber, paymentDate, notes }: { payrollPeriodId: string; amount: number; currency: 'USD' | 'VES'; paymentMethod: string; referenceNumber?: string; paymentDate: string; notes?: string }) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')

  const { error } = await supabase.rpc('register_payroll_payment', {
    p_payroll_period_id: payrollPeriodId,
    p_amount: amount,
    p_currency: currency,
    p_payment_method: paymentMethod,
    p_reference_number: referenceNumber || null,
    p_payment_date: paymentDate,
    p_notes: notes || null,
  })

  if (error) throw new Error('No se pudo registrar el pago de nómina.')
}

export const usePayroll = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ periodStart: '', periodEnd: '', employee: 'all', status: 'all' })

  const payrollQuery = useQuery({ queryKey: payrollKeys.list(filters), queryFn: () => fetchPayroll(filters) })
  const catalogQuery = useQuery({ queryKey: payrollKeys.catalog(), queryFn: fetchCatalog })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: payrollKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['employees'] }),
    ])
  }

  const createMutation = useMutation({ mutationFn: createPayrollPeriod, onSuccess: invalidateAll })
  const payMutation = useMutation({ mutationFn: registerPayrollPayment, onSuccess: invalidateAll })

  const periods = useMemo(() => payrollQuery.data ?? [], [payrollQuery.data])
  const summary = useMemo(
    () => ({
      total: periods.reduce((sum, item) => sum + item.totalAmount, 0),
      paid: periods.reduce((sum, item) => sum + item.paidAmount, 0),
      pending: periods.reduce((sum, item) => sum + Math.max(0, item.totalAmount - item.paidAmount), 0),
      employeesPending: periods.filter((item) => item.totalAmount > item.paidAmount).length,
    }),
    [periods],
  )

  return {
    periods,
    filters,
    setFilters,
    summary,
    employees: catalogQuery.data?.employees ?? [],
    methods: catalogQuery.data?.methods ?? Object.entries(payrollMethodLabels).map(([value, label]) => ({ value, label })),
    isLoading: payrollQuery.isLoading || catalogQuery.isLoading,
    error: payrollQuery.error instanceof Error ? payrollQuery.error.message : catalogQuery.error instanceof Error ? catalogQuery.error.message : null,
    createPayrollPeriod: createMutation.mutateAsync,
    registerPayrollPayment: payMutation.mutateAsync,
    isSaving: createMutation.isPending || payMutation.isPending,
  }
}




