import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

interface ReportsFilters {
  startDate: string
  endDate: string
}

interface ReportSummary {
  incomeTotal: number
  expenseTotal: number
  netTotal: number
  payrollAccrued: number
  payrollPaid: number
  receivableBalance: number
  collectionRate: number
}

interface ReportsData {
  summary: ReportSummary
  collectionsByMethod: Array<{ method: string; total: number; count: number }>
  expensesByCategory: Array<{ category: string; total: number; count: number }>
  topDebtors: Array<{ student: string; guardian: string; classroom: string; balance: number; dueDate: string }>
  payrollByEmployee: Array<{ employee: string; accrued: number; paid: number; pending: number }>
  receivablesByClassroom: Array<{ classroom: string; balance: number; students: number }>
}

const reportsKeys = {
  all: ['reports'] as const,
  summary: (filters: ReportsFilters) => [...reportsKeys.all, filters] as const,
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mobile_payment: 'Pago móvil',
  zelle: 'Zelle',
  other: 'Otro',
}

const fetchReports = async (filters: ReportsFilters): Promise<ReportsData> => {
  if (!supabase) {
    return {
      summary: { incomeTotal: 0, expenseTotal: 0, netTotal: 0, payrollAccrued: 0, payrollPaid: 0, receivableBalance: 0, collectionRate: 0 },
      collectionsByMethod: [],
      expensesByCategory: [],
      topDebtors: [],
      payrollByEmployee: [],
      receivablesByClassroom: [],
    }
  }

  const [paymentsResult, expensesResult, payrollResult, receivablesResult] = await Promise.all([
    supabase.from('payments').select('amount, currency, payment_date, status, payment_method').gte('payment_date', filters.startDate).lte('payment_date', filters.endDate),
    supabase.from('expenses').select('amount, currency, expense_date, status, expense_categories ( name )').gte('expense_date', filters.startDate).lte('expense_date', filters.endDate),
    supabase.from('payroll_periods').select('total_amount, currency, period_start, period_end, status, employees ( full_name ), payroll_payments ( amount )').gte('period_start', filters.startDate).lte('period_end', filters.endDate),
    supabase.from('tuition_obligations').select('amount, amount_paid, due_date, status, students ( first_name, last_name, classrooms ( name ), guardians!students_primary_guardian_id_fkey ( full_name ) )').neq('status', 'cancelled').lte('due_date', filters.endDate),
  ])

  if (paymentsResult.error) throw new Error('No se pudieron cargar los pagos para reportes.')
  if (expensesResult.error) throw new Error('No se pudieron cargar los gastos para reportes.')
  if (payrollResult.error) throw new Error('No se pudo cargar la nomina para reportes.')
  if (receivablesResult.error) throw new Error('No se pudieron cargar las cuentas por cobrar para reportes.')

  const payments = (paymentsResult.data ?? []).filter((item) => item.status === 'active')
  const expenses = (expensesResult.data ?? []).filter((item) => item.status === 'active')
  const payroll = payrollResult.data ?? []
  const receivables = (receivablesResult.data ?? []).map((row) => {
    const student = Array.isArray(row.students) ? row.students[0] : row.students
    const classroomValue = student?.classrooms ? (Array.isArray(student.classrooms) ? student.classrooms[0] : student.classrooms) : null
    const guardianValue = student?.guardians ? (Array.isArray(student.guardians) ? student.guardians[0] : student.guardians) : null
    const balance = Math.max(0, Number(row.amount ?? 0) - Number(row.amount_paid ?? 0))

    return {
      student: student ? `${student.first_name} ${student.last_name}` : 'Alumno sin nombre',
      guardian: guardianValue?.full_name ?? 'Sin representante',
      classroom: classroomValue?.name ?? 'Sin salon',
      dueDate: row.due_date,
      balance,
    }
  }).filter((item) => item.balance > 0)

  const incomeTotal = payments.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
  const payrollAccrued = payroll.reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0)
  const payrollPaid = payroll.reduce((sum, item) => sum + (item.payroll_payments ?? []).reduce((inner, payment) => inner + Number(payment.amount ?? 0), 0), 0)
  const receivableBalance = receivables.reduce((sum, item) => sum + item.balance, 0)
  const expectedTotal = receivablesResult.data?.reduce((sum, item) => sum + Number(item.amount ?? 0), 0) ?? 0
  const collectedTotal = receivablesResult.data?.reduce((sum, item) => sum + Number(item.amount_paid ?? 0), 0) ?? 0
  const collectionRate = expectedTotal > 0 ? Math.round((collectedTotal / expectedTotal) * 100) : 0

  const collectionsMap = new Map<string, { total: number; count: number }>()
  payments.forEach((payment) => {
    const key = paymentMethodLabels[payment.payment_method] ?? payment.payment_method
    const current = collectionsMap.get(key) ?? { total: 0, count: 0 }
    collectionsMap.set(key, { total: current.total + Number(payment.amount ?? 0), count: current.count + 1 })
  })

  const expensesMap = new Map<string, { total: number; count: number }>()
  expenses.forEach((expense) => {
    const categoryValue = expense.expense_categories ? (Array.isArray(expense.expense_categories) ? expense.expense_categories[0] : expense.expense_categories) : null
    const key = categoryValue?.name ?? 'Sin categoria'
    const current = expensesMap.get(key) ?? { total: 0, count: 0 }
    expensesMap.set(key, { total: current.total + Number(expense.amount ?? 0), count: current.count + 1 })
  })

  const payrollMap = new Map<string, { accrued: number; paid: number }>()
  payroll.forEach((period) => {
    const employeeValue = period.employees ? (Array.isArray(period.employees) ? period.employees[0] : period.employees) : null
    const key = employeeValue?.full_name ?? 'Empleado sin nombre'
    const current = payrollMap.get(key) ?? { accrued: 0, paid: 0 }
    const paid = (period.payroll_payments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
    payrollMap.set(key, { accrued: current.accrued + Number(period.total_amount ?? 0), paid: current.paid + paid })
  })

  const classroomMap = new Map<string, { balance: number; students: Set<string> }>()
  receivables.forEach((item) => {
    const current = classroomMap.get(item.classroom) ?? { balance: 0, students: new Set<string>() }
    current.balance += item.balance
    current.students.add(item.student)
    classroomMap.set(item.classroom, current)
  })

  return {
    summary: {
      incomeTotal,
      expenseTotal,
      netTotal: incomeTotal - expenseTotal,
      payrollAccrued,
      payrollPaid,
      receivableBalance,
      collectionRate,
    },
    collectionsByMethod: [...collectionsMap.entries()].map(([method, value]) => ({ method, total: value.total, count: value.count })).sort((a, b) => b.total - a.total),
    expensesByCategory: [...expensesMap.entries()].map(([category, value]) => ({ category, total: value.total, count: value.count })).sort((a, b) => b.total - a.total),
    topDebtors: receivables.sort((a, b) => b.balance - a.balance).slice(0, 8),
    payrollByEmployee: [...payrollMap.entries()].map(([employee, value]) => ({ employee, accrued: value.accrued, paid: value.paid, pending: Math.max(0, value.accrued - value.paid) })).sort((a, b) => b.pending - a.pending),
    receivablesByClassroom: [...classroomMap.entries()].map(([classroom, value]) => ({ classroom, balance: value.balance, students: value.students.size })).sort((a, b) => b.balance - a.balance),
  }
}

export const useReports = (filters: ReportsFilters) => {
  const reportsQuery = useQuery({ queryKey: reportsKeys.summary(filters), queryFn: () => fetchReports(filters) })
  const data = useMemo(
    () => reportsQuery.data ?? {
      summary: { incomeTotal: 0, expenseTotal: 0, netTotal: 0, payrollAccrued: 0, payrollPaid: 0, receivableBalance: 0, collectionRate: 0 },
      collectionsByMethod: [],
      expensesByCategory: [],
      topDebtors: [],
      payrollByEmployee: [],
      receivablesByClassroom: [],
    },
    [reportsQuery.data],
  )

  return {
    ...data,
    isLoading: reportsQuery.isLoading,
    error: reportsQuery.error instanceof Error ? reportsQuery.error.message : null,
  }
}

