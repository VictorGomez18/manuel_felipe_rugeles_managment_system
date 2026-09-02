import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { supabase } from '../../../lib/supabase'
import type { Guardian, GuardianFormValues, GuardianStudentSummary } from '../types'

const PAGE_SIZE = 10

type GuardianClassroomRecord = {
  name: string
}

type GuardianObligationRecord = {
  amount: number | string | null
  amount_paid: number | string | null
  status: string
}

type GuardianPaymentRecord = {
  id: string
  status: string
}

type GuardianStudentRecord = {
  id: string
  first_name: string
  last_name: string
  status: GuardianStudentSummary['status']
  classrooms: GuardianClassroomRecord | GuardianClassroomRecord[] | null
  tuition_obligations?: GuardianObligationRecord[] | null
  payments?: GuardianPaymentRecord[] | null
}

type GuardianRelationRecord = {
  student_id: string
  students: GuardianStudentRecord | GuardianStudentRecord[] | null
}

type GuardianRecord = {
  id: string
  full_name: string
  document_type?: string | null
  document_number?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_active: boolean
  student_guardians?: GuardianRelationRecord[] | null
}

const guardianKeys = {
  all: ['guardians'] as const,
  lists: () => [...guardianKeys.all, 'list'] as const,
  list: (search: string, page: number) => [...guardianKeys.lists(), search, page] as const,
  detail: (id: string) => [...guardianKeys.all, 'detail', id] as const,
}

const formatDocument = (documentType?: string | null, documentNumber?: string | null) => {
  if (!documentNumber) return 'Sin documento'
  if (!documentType || documentType.toLowerCase() === 'cedula') return documentNumber
  return `${documentType}-${documentNumber}`
}

const parseDocument = (value: string) => {
  const trimmed = value.trim()
  const match = trimmed.match(/^([A-Za-z]+)[-\s]?(.*)$/)

  if (!match || !match[2]) {
    return { documentType: 'cedula', documentNumber: trimmed }
  }

  return { documentType: match[1].toUpperCase(), documentNumber: match[2].trim() }
}

const getStudentRecord = (relation: GuardianRelationRecord) => {
  return Array.isArray(relation.students) ? relation.students[0] : relation.students
}

const getClassroomRecord = (student: GuardianStudentRecord | null | undefined) => {
  if (!student) return null
  return Array.isArray(student.classrooms) ? student.classrooms[0] : student.classrooms
}

const mapGuardian = (record: GuardianRecord): Guardian => {
  const relations = record.student_guardians ?? []
  const students = relations.map((relation) => {
    const student = getStudentRecord(relation)
    const classroom = getClassroomRecord(student)

    return {
      id: student?.id ?? relation.student_id,
      fullName: student ? `${student.first_name} ${student.last_name}` : 'Alumno sin nombre',
      status: student?.status ?? 'active',
      classroom: classroom?.name ?? null,
    }
  })

  const obligations = relations.flatMap((relation) => getStudentRecord(relation)?.tuition_obligations ?? [])
  const payments = relations.flatMap((relation) => getStudentRecord(relation)?.payments ?? [])

  return {
    id: record.id,
    fullName: record.full_name,
    documentType: record.document_type,
    documentNumber: record.document_number,
    document: formatDocument(record.document_type, record.document_number),
    phone: record.phone ?? 'Sin teléfono',
    email: record.email ?? 'Sin email',
    address: record.address ?? 'Sin dirección',
    notes: record.notes,
    isActive: record.is_active,
    students,
    debtTotal: obligations.reduce((sum, obligation) => sum + Math.max(0, Number(obligation.amount) - Number(obligation.amount_paid)), 0),
    pendingObligations: obligations.filter((obligation) => Number(obligation.amount_paid) < Number(obligation.amount)).length,
    recentPayments: payments.length,
  }
}

const fetchGuardians = async (search: string, page: number) => {
  if (!supabase) {
    return {
      data: [] as Guardian[],
      count: 0,
    }
  }

  let query = supabase
    .from('guardians')
    .select(`
      id,
      full_name,
      document_type,
      document_number,
      phone,
      email,
      address,
      notes,
      is_active,
      student_guardians (
        student_id,
        students (
          id,
          first_name,
          last_name,
          status,
          classrooms (
            name
          ),
          tuition_obligations (
            amount,
            amount_paid,
            status
          ),
          payments (
            id,
            status
          )
        )
      )
    `, { count: 'exact' })
    .order('full_name')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (search) {
    query = query.or([
      `full_name.ilike.%${search}%`,
      `document_number.ilike.%${search}%`,
      `phone.ilike.%${search}%`,
      `email.ilike.%${search}%`,
    ].join(','))
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error('No se pudieron cargar los representantes.')
  }

  return {
    data: ((data ?? []) as GuardianRecord[]).map(mapGuardian),
    count: count ?? 0,
  }
}

const fetchGuardianDetail = async (id: string) => {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('guardians')
    .select(`
      id,
      full_name,
      document_type,
      document_number,
      phone,
      email,
      address,
      notes,
      is_active,
      student_guardians (
        relationship,
        is_primary,
        student_id,
        students (
          id,
          first_name,
          last_name,
          status,
          classrooms (
            name
          ),
          tuition_obligations (
            amount,
            amount_paid,
            due_date,
            status
          ),
          payments (
            id,
            amount,
            payment_date,
            receipt_number,
            status
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error('No se pudo cargar el detalle del representante.')
  }

  return mapGuardian(data as GuardianRecord)
}

const createGuardian = async (values: GuardianFormValues) => {
  if (!supabase) {
    throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  }

  const { documentType, documentNumber } = parseDocument(values.document)

  const { error } = await supabase.from('guardians').insert({
    full_name: values.fullName.trim(),
    document_type: documentType,
    document_number: documentNumber,
    phone: values.phone.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    notes: values.notes?.trim() || null,
    is_active: values.isActive,
  })

  if (error) {
    throw new Error('No se pudo registrar el representante.')
  }
}

const updateGuardian = async ({ id, values }: { id: string; values: GuardianFormValues }) => {
  if (!supabase) {
    throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  }

  const { documentType, documentNumber } = parseDocument(values.document)

  const { error } = await supabase
    .from('guardians')
    .update({
      full_name: values.fullName.trim(),
      document_type: documentType,
      document_number: documentNumber,
      phone: values.phone.trim(),
      email: values.email.trim(),
      address: values.address.trim(),
      notes: values.notes?.trim() || null,
      is_active: values.isActive,
    })
    .eq('id', id)

  if (error) {
    throw new Error('No se pudo actualizar el representante.')
  }
}

const toggleGuardianStatus = async ({ id, isActive }: { id: string; isActive: boolean }) => {
  if (!supabase) {
    throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  }

  const { error } = await supabase.from('guardians').update({ is_active: isActive }).eq('id', id)

  if (error) {
    throw new Error(isActive ? 'No se pudo activar el representante.' : 'No se pudo desactivar el representante.')
  }
}

export const useGuardians = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)

  const guardiansQuery = useQuery({
    queryKey: guardianKeys.list(debouncedSearch, page),
    queryFn: () => fetchGuardians(debouncedSearch, page),
  })

  const createMutation = useMutation({
    mutationFn: createGuardian,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guardianKeys.lists() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateGuardian,
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: guardianKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: guardianKeys.detail(variables.id) }),
      ])
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleGuardianStatus,
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: guardianKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: guardianKeys.detail(variables.id) }),
      ])
    },
  })

  const totalPages = useMemo(() => {
    const count = guardiansQuery.data?.count ?? 0
    return Math.max(1, Math.ceil(count / PAGE_SIZE))
  }, [guardiansQuery.data?.count])

  return {
    guardians: guardiansQuery.data?.data ?? [],
    total: guardiansQuery.data?.count ?? 0,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    isLoading: guardiansQuery.isLoading,
    error: guardiansQuery.error instanceof Error ? guardiansQuery.error.message : null,
    createGuardian: createMutation.mutateAsync,
    updateGuardian: updateMutation.mutateAsync,
    toggleGuardianStatus: toggleMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || toggleMutation.isPending,
  }
}

export const useGuardianDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: guardianKeys.detail(id ?? 'missing'),
    queryFn: () => fetchGuardianDetail(id ?? ''),
    enabled: Boolean(id),
  })
}



