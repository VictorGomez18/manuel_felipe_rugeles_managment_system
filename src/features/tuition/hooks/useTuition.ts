import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { supabase } from '../../../lib/supabase'
import { useSettings } from '../../settings/hooks/useSettings'
import type { TuitionFilters, TuitionRecord } from '../types'

const today = new Date('2026-08-29T12:00:00-04:00')

const tuitionKeys = {
  all: ['tuition'] as const,
  obligations: (filters: TuitionFilters, search: string) => [...tuitionKeys.all, 'obligations', filters, search] as const,
  receivables: (filters: TuitionFilters, search: string) => [...tuitionKeys.all, 'receivables', filters, search] as const,
}

type TuitionQueryRow = {
  id: string
  student_id: string
  period_id: string
  amount: number | string
  amount_paid: number | string
  due_date: string
  status: TuitionRecord['status']
  students: {
    first_name: string
    last_name: string
    classrooms?: { name: string } | { name: string }[] | null
    guardians?: { full_name: string } | { full_name: string }[] | null
  } | {
    first_name: string
    last_name: string
    classrooms?: { name: string } | { name: string }[] | null
    guardians?: { full_name: string } | { full_name: string }[] | null
  }[] | null
  tuition_periods: {
    period_year: number
    period_month: number
  } | {
    period_year: number
    period_month: number
  }[] | null
}

const toPeriodLabel = (year: number, month: number) => {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' }).format(date)
}

const mapRow = (row: TuitionQueryRow): TuitionRecord => {
  const student = Array.isArray(row.students) ? row.students[0] : row.students
  const classroom = student?.classrooms ? (Array.isArray(student.classrooms) ? student.classrooms[0] : student.classrooms) : null
  const guardian = student?.guardians ? (Array.isArray(student.guardians) ? student.guardians[0] : student.guardians) : null
  const period = Array.isArray(row.tuition_periods) ? row.tuition_periods[0] : row.tuition_periods
  const amount = Number(row.amount ?? 0)
  const amountPaid = Number(row.amount_paid ?? 0)

  return {
    id: row.id,
    studentId: row.student_id,
    studentName: student ? `${student.first_name} ${student.last_name}` : 'Alumno sin nombre',
    guardianName: guardian?.full_name ?? 'Sin representante',
    classroomName: classroom?.name ?? null,
    periodId: row.period_id,
    periodLabel: period ? toPeriodLabel(period.period_year, period.period_month) : 'Sin periodo',
    amount,
    amountPaid,
    balance: Math.max(0, amount - amountPaid),
    dueDate: row.due_date,
    status: row.status,
  }
}

const fetchObligations = async (filters: TuitionFilters, search: string) => {
  if (!supabase) return [] as TuitionRecord[]

  let query = supabase
    .from('tuition_obligations')
    .select(`
      id,
      student_id,
      period_id,
      amount,
      amount_paid,
      due_date,
      status,
      students (
        first_name,
        last_name,
        classrooms ( name ),
        guardians!students_primary_guardian_id_fkey ( full_name )
      ),
      tuition_periods (
        period_year,
        period_month
      )
    `)
    .eq('tuition_periods.period_year', filters.year)
    .eq('tuition_periods.period_month', filters.month)
    .order('due_date')

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`, { foreignTable: 'students' })
  }

  const { data, error } = await query

  if (error) throw new Error('No se pudieron cargar las mensualidades.')

  const records = ((data ?? []) as TuitionQueryRow[]).map(mapRow)
  return filters.classroom === 'all' ? records : records.filter((item) => item.classroomName === filters.classroom)
}

const generateMonthlyObligations = async ({ year, month, dueDay }: { year: number; month: number; dueDay: number }) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')

  const dueDate = new Date(year, month - 1, dueDay)
  const { error } = await supabase.rpc('generate_tuition_obligations', {
    p_year: year,
    p_month: month,
    p_due_date: dueDate.toISOString().slice(0, 10),
  })

  if (error) throw new Error('No se pudieron generar las mensualidades.')
}

export const useTuition = () => {
  const queryClient = useQueryClient()
  const { settings } = useSettings()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TuitionFilters>({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    classroom: 'all',
    status: 'all',
  })
  const debouncedSearch = useDebouncedValue(search)

  const obligationsQuery = useQuery({
    queryKey: tuitionKeys.obligations(filters, debouncedSearch),
    queryFn: () => fetchObligations(filters, debouncedSearch),
  })

  const generateMutation = useMutation({
    mutationFn: () => generateMonthlyObligations({ year: filters.year, month: filters.month, dueDay: settings?.monthlyFeeDueDay ?? 5 }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tuitionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })

  const obligations = useMemo(() => obligationsQuery.data ?? [], [obligationsQuery.data])
  const summary = useMemo(() => {
    const expected = obligations.reduce((sum, item) => sum + item.amount, 0)
    const collected = obligations.reduce((sum, item) => sum + item.amountPaid, 0)
    const pending = obligations.reduce((sum, item) => sum + item.balance, 0)
    const overdue = obligations.filter((item) => item.status === 'overdue').reduce((sum, item) => sum + item.balance, 0)
    const receivableGuardians = new Set(obligations.filter((item) => item.balance > 0).map((item) => item.guardianName)).size
    const dueSoon = obligations.filter((item) => {
      const diff = Math.floor((new Date(`${item.dueDate}T00:00:00`).getTime() - today.getTime()) / 86400000)
      return item.balance > 0 && diff >= 0 && diff <= 5
    }).reduce((sum, item) => sum + item.balance, 0)

    return { expected, collected, pending, overdue, receivableGuardians, dueSoon }
  }, [obligations])

  const classrooms = Array.from(new Set(obligations.map((item) => item.classroomName).filter(Boolean))) as string[]

  return {
    obligations,
    filters,
    setFilters,
    search,
    setSearch,
    classrooms,
    summary,
    isLoading: obligationsQuery.isLoading,
    error: obligationsQuery.error instanceof Error ? obligationsQuery.error.message : null,
    generateMonthlyObligations: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  }
}





