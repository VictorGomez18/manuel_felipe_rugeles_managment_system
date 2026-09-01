import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { formatCurrency } from '../../../lib/format'
import { supabase } from '../../../lib/supabase'
import type { PaymentFormValues, PaymentRecord } from '../types'

const PAGE_SIZE = 12
const TODAY = '2026-08-29'
const MONTH_START = '2026-08-01'
const MONTH_END = '2026-09-01'

const paymentsKeys = {
  all: ['payments'] as const,
  list: (page: number, search: string, filters: Record<string, string>) => [...paymentsKeys.all, page, search, filters] as const,
  detail: (id: string) => [...paymentsKeys.all, 'detail', id] as const,
  catalog: () => [...paymentsKeys.all, 'catalog'] as const,
}

type PaymentRow = {
  id: string
  receipt_number?: string | null
  amount: number | string
  currency: 'USD' | 'VES'
  payment_method: string
  reference_number?: string | null
  payment_date: string
  status: 'active' | 'voided'
  notes?: string | null
  students?: { id: string; first_name: string; last_name: string } | { id: string; first_name: string; last_name: string }[] | null
  guardians?: { id: string; full_name: string } | { id: string; full_name: string }[] | null
  payment_concepts?: { id: string; name: string } | { id: string; name: string }[] | null
  profiles?: { full_name: string } | { full_name: string }[] | null
}

type ObligationRow = {
  id: string
  amount: number | string
  amount_paid: number | string
  due_date: string
  status: string
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mobile_payment: 'Pago móvil',
  zelle: 'Zelle',
  other: 'Otro',
}

const mapPayment = (row: PaymentRow): PaymentRecord => {
  const student = Array.isArray(row.students) ? row.students[0] : row.students
  const guardian = Array.isArray(row.guardians) ? row.guardians[0] : row.guardians
  const concept = Array.isArray(row.payment_concepts) ? row.payment_concepts[0] : row.payment_concepts
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

  return {
    id: row.id,
    receiptNumber: row.receipt_number ?? 'Sin recibo',
    studentId: student?.id ?? '',
    studentName: student ? `${student.first_name} ${student.last_name}` : 'Alumno sin nombre',
    guardianId: guardian?.id ?? '',
    guardianName: guardian?.full_name ?? 'Sin representante',
    conceptId: concept?.id,
    conceptName: concept?.name ?? 'Sin concepto',
    amount: Number(row.amount ?? 0),
    currency: row.currency,
    paymentMethod: row.payment_method,
    referenceNumber: row.reference_number,
    paymentDate: row.payment_date,
    status: row.status,
    registeredBy: profile?.full_name ?? null,
    notes: row.notes,
  }
}

const fetchPayments = async (page: number, search: string, filters: Record<string, string>) => {
  if (!supabase) return { data: [] as PaymentRecord[], count: 0 }

  let query = supabase
    .from('payments')
    .select(`
      id,
      receipt_number,
      amount,
      currency,
      payment_method,
      reference_number,
      payment_date,
      status,
      notes,
      students ( id, first_name, last_name ),
      guardians ( id, full_name ),
      payment_concepts ( id, name ),
      profiles!payments_registered_by_fkey ( full_name )
    `, { count: 'exact' })
    .order('payment_date', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (filters.date) query = query.eq('payment_date', filters.date)
  if (filters.method !== 'all') query = query.eq('payment_method', filters.method)
  if (filters.concept !== 'all') query = query.eq('concept_id', filters.concept)
  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.student !== 'all') query = query.eq('student_id', filters.student)

  if (search) {
    query = query.or(`receipt_number.ilike.%${search}%,reference_number.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw new Error('No se pudieron cargar los pagos.')

  return { data: ((data ?? []) as PaymentRow[]).map(mapPayment), count: count ?? 0 }
}

const fetchCatalog = async () => {
  if (!supabase) {
    return { students: [], concepts: [], methods: Object.entries(paymentMethodLabels).map(([value, label]) => ({ value, label })) }
  }

  const [studentsResult, conceptsResult] = await Promise.all([
    supabase.from('students').select('id, first_name, last_name, primary_guardian_id, monthly_fee, currency').order('first_name'),
    supabase.from('payment_concepts').select('id, name').eq('is_active', true).order('name'),
  ])

  if (studentsResult.error) throw new Error('No se pudieron cargar los alumnos para pagos.')
  if (conceptsResult.error) throw new Error('No se pudieron cargar los conceptos de cobro.')

  return {
    students: (studentsResult.data ?? []).map((student) => ({
      id: student.id,
      label: `${student.first_name} ${student.last_name}`,
      guardianId: student.primary_guardian_id,
      monthlyFee: Number(student.monthly_fee ?? 0),
      currency: student.currency as 'USD' | 'VES',
    })),
    concepts: (conceptsResult.data ?? []).map((concept) => ({ id: concept.id, label: concept.name })),
    methods: Object.entries(paymentMethodLabels).map(([value, label]) => ({ value, label })),
  }
}

const fetchPendingObligations = async (studentId: string) => {
  if (!supabase || !studentId) return [] as ObligationRow[]

  const { data, error } = await supabase
    .from('tuition_obligations')
    .select('id, amount, amount_paid, due_date, status')
    .eq('student_id', studentId)
    .in('status', ['pending', 'partial', 'overdue'])
    .order('due_date')

  if (error) throw new Error('No se pudieron cargar las obligaciones pendientes.')
  return (data ?? []) as ObligationRow[]
}

const createPayment = async (values: PaymentFormValues) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')

  const { data, error } = await supabase.rpc('register_payment', {
    p_student_id: values.studentId,
    p_guardian_id: values.guardianId,
    p_amount: values.amount,
    p_currency: values.currency,
    p_method: values.paymentMethod,
    p_reference: values.referenceNumber || null,
    p_concept_id: values.conceptId || null,
    p_payment_date: values.paymentDate,
    p_notes: values.notes || null,
  })

  if (error) throw new Error('No se pudo registrar el pago.')
  return data as { payment_id: string; receipt_number: string; unallocated: number }
}

const voidPayment = async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { error } = await supabase.rpc('void_payment', { p_payment_id: paymentId, p_reason: reason })
  if (error) throw new Error('No se pudo anular el pago.')
}

const fetchPaymentDetail = async (id: string) => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id,
      receipt_number,
      amount,
      currency,
      payment_method,
      reference_number,
      payment_date,
      status,
      notes,
      students ( id, first_name, last_name ),
      guardians ( id, full_name ),
      payment_concepts ( id, name ),
      profiles!payments_registered_by_fkey ( full_name )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error('No se pudo cargar el recibo.')
  return mapPayment(data as PaymentRow)
}

export const usePayments = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ date: '', student: 'all', method: 'all', concept: 'all', status: 'all' })
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const paymentsQuery = useQuery({ queryKey: paymentsKeys.list(page, debouncedSearch, filters), queryFn: () => fetchPayments(page, debouncedSearch, filters) })
  const catalogQuery = useQuery({ queryKey: paymentsKeys.catalog(), queryFn: fetchCatalog })
  const obligationsQuery = useQuery({ queryKey: [...paymentsKeys.all, 'obligations', selectedStudentId] as const, queryFn: () => fetchPendingObligations(selectedStudentId), enabled: Boolean(selectedStudentId) })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: paymentsKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['tuition'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['students'] }),
      queryClient.invalidateQueries({ queryKey: ['guardians'] }),
    ])
  }

  const createMutation = useMutation({ mutationFn: createPayment, onSuccess: invalidateAll })
  const voidMutation = useMutation({ mutationFn: voidPayment, onSuccess: invalidateAll })

  const payments = useMemo(() => paymentsQuery.data?.data ?? [], [paymentsQuery.data])
  const summary = useMemo(() => {
    const todayPayments = payments.filter((item) => item.paymentDate === TODAY && item.status === 'active')
    const monthPayments = payments.filter((item) => item.paymentDate >= MONTH_START && item.paymentDate < MONTH_END && item.status === 'active')
    return {
      todayTotal: todayPayments.reduce((sum, item) => sum + item.amount, 0),
      monthTotal: monthPayments.reduce((sum, item) => sum + item.amount, 0),
      count: paymentsQuery.data?.count ?? 0,
      latestReceipt: payments[0]?.receiptNumber ?? 'Sin recibos',
    }
  }, [payments, paymentsQuery.data?.count])

  const pendingSummary = useMemo(() => {
    const obligations = obligationsQuery.data ?? []
    const debt = obligations.reduce((sum, item) => sum + Math.max(0, Number(item.amount) - Number(item.amount_paid)), 0)
    return {
      debt,
      rows: obligations.map((item) => ({
        id: item.id,
        balance: Math.max(0, Number(item.amount) - Number(item.amount_paid)),
        label: `${item.due_date} · ${formatCurrency(Math.max(0, Number(item.amount) - Number(item.amount_paid)))}`,
      })),
    }
  }, [obligationsQuery.data])

  return {
    payments,
    totalPages: Math.max(1, Math.ceil((paymentsQuery.data?.count ?? 0) / PAGE_SIZE)),
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilters,
    catalog: catalogQuery.data,
    summary,
    pendingSummary,
    setSelectedStudentId,
    isLoading: paymentsQuery.isLoading || catalogQuery.isLoading,
    error: paymentsQuery.error instanceof Error ? paymentsQuery.error.message : catalogQuery.error instanceof Error ? catalogQuery.error.message : null,
    createPayment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    voidPayment: voidMutation.mutateAsync,
    isVoiding: voidMutation.isPending,
  }
}

export const usePaymentDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: paymentsKeys.detail(id ?? 'missing'),
    queryFn: () => fetchPaymentDetail(id ?? ''),
    enabled: Boolean(id),
  })
}



