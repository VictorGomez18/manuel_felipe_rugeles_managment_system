import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { supabase } from '../../../lib/supabase'
import type { EmployeeRecord } from '../types'

const PAGE_SIZE = 12
const employeeKeys = {
  all: ['employees'] as const,
  list: (page: number, search: string) => [...employeeKeys.all, page, search] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
}

type EmployeeRow = {
  id: string
  full_name: string
  document_type?: string | null
  document_number?: string | null
  phone?: string | null
  role: string
  hire_date?: string | null
  base_salary: number | string
  currency: 'USD' | 'VES'
  payroll_frequency: string
  status: 'active' | 'inactive'
  notes?: string | null
}

const formatDocument = (documentType?: string | null, documentNumber?: string | null) => {
  if (!documentNumber) return 'Sin documento'
  if (!documentType || documentType === 'cedula') return documentNumber
  return `${documentType}-${documentNumber}`
}

const parseDocument = (value: string) => {
  const match = value.trim().match(/^([A-Za-z]+)[-\s]?(.*)$/)
  if (!match || !match[2]) return { document_type: 'cedula', document_number: value.trim() }
  return { document_type: match[1].toUpperCase(), document_number: match[2].trim() }
}

const mapEmployee = (row: EmployeeRow): EmployeeRecord => ({
  id: row.id,
  fullName: row.full_name,
  document: formatDocument(row.document_type, row.document_number),
  phone: row.phone ?? 'Sin teléfono',
  role: row.role,
  hireDate: row.hire_date,
  baseSalary: Number(row.base_salary ?? 0),
  currency: row.currency,
  payrollFrequency: row.payroll_frequency,
  status: row.status,
  notes: row.notes,
})

const fetchEmployees = async (page: number, search: string) => {
  if (!supabase) return { data: [] as EmployeeRecord[], count: 0 }

  let query = supabase
    .from('employees')
    .select('id, full_name, document_type, document_number, phone, role, hire_date, base_salary, currency, payroll_frequency, status, notes', { count: 'exact' })
    .order('full_name')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (search) query = query.or(`full_name.ilike.%${search}%,document_number.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw new Error('No se pudieron cargar los empleados.')

  return { data: ((data ?? []) as EmployeeRow[]).map(mapEmployee), count: count ?? 0 }
}

const fetchEmployeeDetail = async (id: string) => {
  if (!supabase) return null

  const [employeeResult, payrollResult] = await Promise.all([
    supabase.from('employees').select('id, full_name, document_type, document_number, phone, role, hire_date, base_salary, currency, payroll_frequency, status, notes').eq('id', id).single(),
    supabase.from('payroll_periods').select('id, period_start, period_end, total_amount, status, due_date, payroll_payments ( id, amount, payment_date, payment_method, reference_number )').eq('employee_id', id).order('period_start', { ascending: false }),
  ])

  if (employeeResult.error) throw new Error('No se pudo cargar el detalle del empleado.')
  if (payrollResult.error) throw new Error('No se pudo cargar el historial de nómina del empleado.')

  const payrollHistory = payrollResult.data ?? []
  const payments = payrollHistory.flatMap((period) =>
    (period.payroll_payments ?? []).map((payment) => ({
      ...payment,
      payrollPeriodId: period.id,
      periodStart: period.period_start,
      periodEnd: period.period_end,
      status: period.status,
    })),
  )

  return {
    employee: mapEmployee(employeeResult.data as EmployeeRow),
    payrollHistory,
    payments,
  }
}

const saveEmployee = async (values: Omit<EmployeeRecord, 'id'>, id?: string) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')

  const document = parseDocument(values.document)
  const payload = {
    full_name: values.fullName,
    phone: values.phone,
    role: values.role,
    hire_date: values.hireDate || null,
    base_salary: values.baseSalary,
    currency: values.currency,
    payroll_frequency: values.payrollFrequency,
    status: values.status,
    notes: values.notes || null,
    ...document,
  }

  const query = id ? supabase.from('employees').update(payload).eq('id', id) : supabase.from('employees').insert(payload)
  const { error } = await query
  if (error) throw new Error(id ? 'No se pudo actualizar el empleado.' : 'No se pudo registrar el empleado.')
}

const toggleEmployeeStatus = async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { error } = await supabase.from('employees').update({ status }).eq('id', id)
  if (error) throw new Error('No se pudo actualizar el estado del empleado.')
}

export const useEmployees = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const employeesQuery = useQuery({ queryKey: employeeKeys.list(page, debouncedSearch), queryFn: () => fetchEmployees(page, debouncedSearch) })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['payroll'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ])
  }

  const saveMutation = useMutation({ mutationFn: ({ id, values }: { id?: string; values: Omit<EmployeeRecord, 'id'> }) => saveEmployee(values, id), onSuccess: invalidateAll })
  const toggleMutation = useMutation({ mutationFn: toggleEmployeeStatus, onSuccess: invalidateAll })

  const employees = useMemo(() => employeesQuery.data?.data ?? [], [employeesQuery.data])
  const summary = useMemo(
    () => ({
      active: employees.filter((item) => item.status === 'active').length,
      teachers: employees.filter((item) => item.role === 'teacher').length,
      admins: employees.filter((item) => item.role !== 'teacher').length,
      payrollEstimate: employees.filter((item) => item.status === 'active').reduce((sum, item) => sum + item.baseSalary, 0),
    }),
    [employees],
  )

  return {
    employees,
    totalPages: Math.max(1, Math.ceil((employeesQuery.data?.count ?? 0) / PAGE_SIZE)),
    page,
    setPage,
    search,
    setSearch,
    summary,
    isLoading: employeesQuery.isLoading,
    error: employeesQuery.error instanceof Error ? employeesQuery.error.message : null,
    saveEmployee: saveMutation.mutateAsync,
    toggleEmployeeStatus: toggleMutation.mutateAsync,
    isSaving: saveMutation.isPending || toggleMutation.isPending,
  }
}

export const useEmployeeDetail = (id: string | undefined) =>
  useQuery({
    queryKey: employeeKeys.detail(id ?? 'missing'),
    queryFn: () => fetchEmployeeDetail(id ?? ''),
    enabled: Boolean(id),
  })



