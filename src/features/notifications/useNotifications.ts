import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface AppNotification {
  id: string
  title: string
  detail: string
  tone: 'warning' | 'danger' | 'info'
  href: string
  time: string
}

const today = new Date().toISOString().slice(0, 10)
const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const fetchNotifications = async (): Promise<AppNotification[]> => {
  if (!supabase) return []

  const [tuitionResult, payrollResult] = await Promise.all([
    supabase.from('tuition_obligations').select('id, due_date, amount, amount_paid, status').in('status', ['pending', 'partial', 'overdue']).lte('due_date', today).order('due_date').limit(8),
    supabase.from('payroll_periods').select('id, due_date, status, employees ( full_name )').in('status', ['pending', 'partial', 'overdue']).not('due_date', 'is', null).lte('due_date', inSevenDays).order('due_date').limit(6),
  ])

  if (tuitionResult.error || payrollResult.error) return []

  const tuition = (tuitionResult.data ?? []).map((item) => ({
    id: `tuition-${item.id}`,
    title: item.status === 'overdue' || item.due_date < today ? 'Mensualidad vencida' : 'Mensualidad por vencer',
    detail: `Saldo pendiente: USD ${Math.max(0, Number(item.amount) - Number(item.amount_paid)).toFixed(2)}.`,
    tone: (item.status === 'overdue' || item.due_date < today ? 'danger' : 'warning') as 'danger' | 'warning',
    href: '/mensualidades',
    time: item.due_date,
  }))

  const payroll = (payrollResult.data ?? []).map((item) => {
    const employee = Array.isArray(item.employees) ? item.employees[0] : item.employees
    return {
      id: `payroll-${item.id}`,
      title: item.due_date < today ? 'Pago de nómina vencido' : 'Pago de nómina próximo',
      detail: `${employee?.full_name ?? 'Empleado'} · vence el ${item.due_date}.`,
      tone: (item.due_date < today ? 'danger' : 'warning') as 'danger' | 'warning',
      href: '/nomina',
      time: item.due_date,
    }
  })

  return [...tuition, ...payroll].sort((left, right) => left.time.localeCompare(right.time))
}

export const useNotifications = () => useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 60_000,
  refetchInterval: 60_000,
})
