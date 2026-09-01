import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/auth-context'

export type DashboardIcon = 'GraduationCap' | 'WalletCards' | 'CircleDollarSign' | 'PieChart'

export interface StatData {
  label: string
  value: string
  trend?: string
  trendDirection?: 'up' | 'down'
  icon: DashboardIcon
  color: 'primary' | 'success' | 'accent' | 'info'
  highlight?: boolean
  progress?: number
}

export interface AlertItem {
  type: 'warning' | 'info'
  message: string
  detail: string
}

interface CashflowPoint {
  month: string
  ingresos: number
  gastos: number
}

interface RecentPaymentItem {
  receipt: string
  student: string
  amount: string
  method: string
  date: string
}

interface OverdueItem {
  student: string
  days: number
  amount: string
}

interface DashboardData {
  stats: StatData[]
  cashflowData: CashflowPoint[]
  recentPayments: RecentPaymentItem[]
  overdueList: OverdueItem[]
  alerts: AlertItem[]
  collection: {
    collected: number
    expected: number
    percentage: number
    pendingCount: number
    trend: string
  }
  isUsingMockData: boolean
}

const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (role: string | null) => [...dashboardKeys.all, role ?? 'anonymous'] as const,
}

const monthFormatter = new Intl.DateTimeFormat('es-VE', { month: 'short' })
const dateFormatter = new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const methodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mobile_payment: 'Pago móvil',
  zelle: 'Zelle',
  other: 'Otro',
}

const currentDate = new Date('2026-08-29T12:00:00-04:00')
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() + 1
const currentMonthStart = new Date(currentYear, currentMonth - 1, 1)
const nextMonthStart = new Date(currentYear, currentMonth, 1)
const sixMonthsStart = new Date(currentYear, currentMonth - 6, 1)

const formatCurrency = (value: number | null | undefined) => currencyFormatter.format(value ?? 0)

const capitalizeMonth = (value: Date) => {
  const label = monthFormatter.format(value).replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const daysBetween = (from: Date, to: Date) => Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000))

const fallbackData: DashboardData = {
  stats: [
    { label: 'Alumnos activos', value: '84', trend: '+3 este mes', trendDirection: 'up', icon: 'GraduationCap', color: 'primary' },
    { label: 'Ingresos del mes', value: '$3,240.00', trend: '+12% vs. mes anterior', trendDirection: 'up', icon: 'WalletCards', color: 'success', highlight: true },
    { label: 'Pendiente por cobrar', value: '$480.00', trend: '18 vencidos', trendDirection: 'down', icon: 'CircleDollarSign', color: 'accent' },
    { label: 'Cobranza', value: '87%', progress: 87, icon: 'PieChart', color: 'info' },
  ],
  cashflowData: [
    { month: 'Mar', ingresos: 2900, gastos: 2300 },
    { month: 'Abr', ingresos: 3240, gastos: 2400 },
    { month: 'May', ingresos: 3350, gastos: 2500 },
    { month: 'Jun', ingresos: 3100, gastos: 2600 },
    { month: 'Jul', ingresos: 3400, gastos: 2450 },
    { month: 'Ago', ingresos: 3240, gastos: 2400 },
  ],
  recentPayments: [
    { receipt: '2026-000123', student: 'Sofia Perez', amount: '$40.00', method: 'Efectivo', date: '28 ago 2026' },
    { receipt: '2026-000122', student: 'Mateo Gonzalez', amount: '$35.00', method: 'Transferencia', date: '27 ago 2026' },
    { receipt: '2026-000121', student: 'Valentina Rojas', amount: '$50.00', method: 'Pago móvil', date: '26 ago 2026' },
  ],
  overdueList: [
    { student: 'Camila Torres', days: 5, amount: '$40.00' },
    { student: 'Diego Herrera', days: 3, amount: '$35.00' },
    { student: 'Isabella Castro', days: 1, amount: '$50.00' },
  ],
  alerts: [
    { type: 'warning', message: '3 mensualidades vencidas', detail: 'Requieren seguimiento' },
    { type: 'info', message: 'Nomina proxima a vencer', detail: '4 empleados pendientes' },
  ],
  collection: {
    collected: 3240,
    expected: 3720,
    percentage: 87,
    pendingCount: 18,
    trend: '+12% vs. julio',
  },
  isUsingMockData: true,
}

export const useDashboardData = () => {
  const { can, role } = useAuth()

  return useQuery({
    queryKey: dashboardKeys.summary(role),
    queryFn: async (): Promise<DashboardData> => {
      if (!supabase) {
        return fallbackData
      }

      const canViewPayments = can('payments.view')
      const canViewExpenses = can('expenses.view')
      const canViewPayroll = can('payroll.view')

      const [studentsResult, obligationsResult, periodsResult, paymentsResult, expensesResult, payrollResult] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase
          .from('tuition_obligations')
          .select('id, period_id, amount, amount_paid, due_date, status, student_id, students ( first_name, last_name )')
          .neq('status', 'cancelled'),
        supabase
          .from('tuition_periods')
          .select('id, period_year, period_month')
          .eq('period_year', currentYear)
          .eq('period_month', currentMonth)
          .maybeSingle(),
        canViewPayments
          ? supabase
              .from('payments')
              .select('id, amount, currency, payment_method, payment_date, receipt_number, created_at, status, student_id, students ( first_name, last_name )')
              .eq('status', 'active')
              .gte('payment_date', currentMonthStart.toISOString().slice(0, 10))
              .lt('payment_date', nextMonthStart.toISOString().slice(0, 10))
          : Promise.resolve({ data: [], error: null }),
        canViewExpenses
          ? supabase
              .from('expenses')
              .select('id, amount, currency, expense_date, status')
              .eq('status', 'active')
              .gte('expense_date', sixMonthsStart.toISOString().slice(0, 10))
          : Promise.resolve({ data: [], error: null }),
        canViewPayroll
          ? supabase
              .from('payroll_periods')
              .select('id, due_date, status, total_amount')
              .in('status', ['pending', 'partial', 'overdue'])
          : Promise.resolve({ data: [], error: null }),
      ])

      if (studentsResult.error) throw new Error('No se pudo cargar el total de alumnos activos.')
      if (obligationsResult.error) throw new Error('No se pudieron cargar las obligaciones de mensualidad.')
      if (periodsResult.error) throw new Error('No se pudo cargar el periodo actual de mensualidades.')
      if (paymentsResult.error) throw new Error('No se pudieron cargar los pagos del dashboard.')
      if (expensesResult.error) throw new Error('No se pudieron cargar los gastos del dashboard.')
      if (payrollResult.error) throw new Error('No se pudo cargar la nomina del dashboard.')

      const activeStudents = studentsResult.count ?? 0
      const obligations = obligationsResult.data ?? []
      const currentPeriodId = periodsResult.data?.id ?? null
      const monthObligations = currentPeriodId
        ? obligations.filter((item) => 'period_id' in item ? false : true)
        : []
      void monthObligations

      const overdueItems = obligations
        .filter((item) => {
          const dueDate = item.due_date ? new Date(`${item.due_date}T00:00:00`) : null
          return dueDate && dueDate < currentDate && Number(item.amount_paid) < Number(item.amount)
        })
        .sort((left, right) => {
          const leftDate = new Date(`${left.due_date}T00:00:00`).getTime()
          const rightDate = new Date(`${right.due_date}T00:00:00`).getTime()
          return leftDate - rightDate
        })

      const overdueList = overdueItems.slice(0, 4).map((item) => {
        const student = Array.isArray(item.students) ? item.students[0] : item.students
        const dueDate = new Date(`${item.due_date}T00:00:00`)

        return {
          student: student ? `${student.first_name} ${student.last_name}` : 'Alumno sin nombre',
          days: daysBetween(dueDate, currentDate),
          amount: formatCurrency(Number(item.amount) - Number(item.amount_paid)),
        }
      })

      const expected = obligations
        .filter((item) => {
          if (!currentPeriodId) return false
          return (item as { period_id?: string }).period_id === currentPeriodId
        })
        .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

      const collected = obligations
        .filter((item) => {
          if (!currentPeriodId) return false
          return (item as { period_id?: string }).period_id === currentPeriodId
        })
        .reduce((sum, item) => sum + Number(item.amount_paid ?? 0), 0)

      const pendingBalance = obligations.reduce((sum, item) => sum + Math.max(0, Number(item.amount) - Number(item.amount_paid)), 0)
      const percentage = expected > 0 ? Math.round((collected / expected) * 100) : 0

      const activeMonthPayments = paymentsResult.data ?? []
      const incomeMonth = activeMonthPayments.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

      const previousMonthStart = new Date(currentYear, currentMonth - 2, 1)
      const currentMonthPaymentsCount = activeMonthPayments.length
      const previousMonthPayments = canViewPayments
        ? await supabase
            .from('payments')
            .select('id, amount')
            .eq('status', 'active')
            .gte('payment_date', previousMonthStart.toISOString().slice(0, 10))
            .lt('payment_date', currentMonthStart.toISOString().slice(0, 10))
        : { data: [], error: null }

      if (previousMonthPayments.error) throw new Error('No se pudieron comparar los ingresos del mes anterior.')

      const previousIncome = (previousMonthPayments.data ?? []).reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
      const incomeTrend = previousIncome > 0
        ? `${incomeMonth >= previousIncome ? '+' : ''}${Math.round(((incomeMonth - previousIncome) / previousIncome) * 100)}% vs. mes anterior`
        : `${currentMonthPaymentsCount} pagos este mes`

      const chartMonths = Array.from({ length: 6 }, (_, index) => new Date(currentYear, currentMonth - 6 + index, 1))
      const paymentsForChart = canViewPayments
        ? await supabase
            .from('payments')
            .select('amount, payment_date, status')
            .eq('status', 'active')
            .gte('payment_date', sixMonthsStart.toISOString().slice(0, 10))
        : { data: [], error: null }

      if (paymentsForChart.error) throw new Error('No se pudo construir el flujo de caja del dashboard.')

      const cashflowData = chartMonths.map((monthDate) => {
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
        const ingresos = (paymentsForChart.data ?? [])
          .filter((item) => item.payment_date?.startsWith(monthKey))
          .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
        const gastos = (expensesResult.data ?? [])
          .filter((item) => item.expense_date?.startsWith(monthKey))
          .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

        return {
          month: capitalizeMonth(monthDate),
          ingresos,
          gastos,
        }
      })

      const recentPayments = activeMonthPayments
        .sort((left, right) => new Date(right.created_at ?? right.payment_date).getTime() - new Date(left.created_at ?? left.payment_date).getTime())
        .slice(0, 5)
        .map((payment) => {
          const student = Array.isArray(payment.students) ? payment.students[0] : payment.students

          return {
            receipt: payment.receipt_number ?? 'Sin recibo',
            student: student ? `${student.first_name} ${student.last_name}` : 'Alumno sin nombre',
            amount: formatCurrency(Number(payment.amount ?? 0)),
            method: methodLabels[payment.payment_method] ?? payment.payment_method,
            date: payment.payment_date ? dateFormatter.format(new Date(`${payment.payment_date}T00:00:00`)).toLowerCase() : 'Sin fecha',
          }
        })

      const payrollItems = payrollResult.data ?? []
      const payrollSoon = payrollItems.filter((item) => item.due_date && daysBetween(currentDate, new Date(`${item.due_date}T00:00:00`)) <= 7)
      const alerts: AlertItem[] = []

      if (overdueItems.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${overdueItems.length} mensualidades vencidas`,
          detail: 'Requieren seguimiento inmediato desde cuentas por cobrar.',
        })
      }

      if (payrollSoon.length > 0) {
        alerts.push({
          type: 'info',
          message: 'Nomina proxima a vencer',
          detail: `${payrollSoon.length} periodos requieren revision esta semana.`,
        })
      }

      if (alerts.length === 0) {
        alerts.push({
          type: 'info',
          message: 'Operacion al dia',
          detail: 'No hay alertas administrativas prioritarias para hoy.',
        })
      }

      return {
        stats: [
          {
            label: 'Alumnos activos',
            value: String(activeStudents),
            trend: activeStudents > 0 ? `${activeStudents} alumnos vigentes` : 'Sin alumnos activos',
            trendDirection: 'up',
            icon: 'GraduationCap',
            color: 'primary',
          },
          {
            label: 'Ingresos del mes',
            value: canViewPayments ? formatCurrency(incomeMonth) : 'Sin acceso',
            trend: canViewPayments ? incomeTrend : 'Tu rol no puede ver pagos',
            trendDirection: incomeMonth >= previousIncome ? 'up' : 'down',
            icon: 'WalletCards',
            color: 'success',
            highlight: true,
          },
          {
            label: 'Pendiente por cobrar',
            value: formatCurrency(pendingBalance),
            trend: overdueItems.length > 0 ? `${overdueItems.length} vencidas` : 'Sin vencimientos',
            trendDirection: overdueItems.length > 0 ? 'down' : 'up',
            icon: 'CircleDollarSign',
            color: 'accent',
          },
          {
            label: 'Cobranza',
            value: `${percentage}%`,
            progress: percentage,
            icon: 'PieChart',
            color: 'info',
          },
        ],
        cashflowData,
        recentPayments,
        overdueList,
        alerts,
        collection: {
          collected,
          expected,
          percentage,
          pendingCount: obligations.filter((item) => Number(item.amount_paid) < Number(item.amount)).length,
          trend: canViewPayments ? incomeTrend : 'Sin acceso a comparativo de pagos',
        },
        isUsingMockData: false,
      }
    },
  })
}



