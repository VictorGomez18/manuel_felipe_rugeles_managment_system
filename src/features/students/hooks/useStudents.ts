import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { guardianContactPayload } from '../../guardians/contactValidation'
import { appCurrentDate } from '../../../lib/format'
import { supabase } from '../../../lib/supabase'
import type {
  ClassroomOption,
  LevelOption,
  NewGuardianInput,
  Representative,
  Student,
  StudentDetailRecord,
  StudentFormValues,
  StudentGuardianRecord,
  StudentHistoryRecord,
  StudentObligationRecord,
  StudentPaymentRecord,
} from '../types'

const mockLevels: LevelOption[] = [
  { id: 'level-maternal', name: 'Maternal' },
  { id: 'level-preescolar', name: 'Preescolar' },
]

const mockClassrooms: ClassroomOption[] = [
  { id: 'classroom-sala-3', name: 'Sala 3', levelId: 'level-preescolar', levelName: 'Preescolar' },
  { id: 'classroom-sala-4', name: 'Sala 4', levelId: 'level-preescolar', levelName: 'Preescolar' },
  { id: 'classroom-sala-5', name: 'Sala 5', levelId: 'level-preescolar', levelName: 'Preescolar' },
]

const mockRepresentatives: Representative[] = [
  {
    id: 'rep-1',
    fullName: 'Maria Perez',
    documentType: 'V',
    documentNumber: '12345678',
    document: 'V-12345678',
    phone: '0414-1234567',
    email: 'maria.perez@email.com',
    address: 'Av. Principal, Calle 5, Casa 23',
    relationship: 'Madre',
  },
  {
    id: 'rep-2',
    fullName: 'Carlos Gonzalez',
    documentType: 'V',
    documentNumber: '87654321',
    document: 'V-87654321',
    phone: '0414-5555678',
    email: 'carlos.gonzalez@email.com',
    address: 'Calle 8, Casa 45',
    relationship: 'Padre',
  },
  {
    id: 'rep-3',
    fullName: 'Ana Rojas',
    documentType: 'V',
    documentNumber: '11223344',
    document: 'V-11223344',
    phone: '0416-5559012',
    email: 'ana.rojas@email.com',
    address: 'Urbanizacion El Parque, Casa 12',
    relationship: 'Madre',
  },
]

const mockStudents: Student[] = [
  {
    id: '1',
    firstName: 'Sofia',
    lastName: 'Perez',
    fullName: 'Sofia Perez',
    documentType: 'V',
    documentNumber: '22345678',
    document: 'V-22345678',
    birthDate: '2020-03-15',
    level: 'Preescolar',
    levelId: 'level-preescolar',
    classroom: 'Sala 4',
    classroomId: 'classroom-sala-4',
    monthlyFee: 40,
    currency: 'USD',
    status: 'active',
    guardian: 'Maria Perez',
    guardianId: 'rep-1',
    guardianRelationship: 'Madre',
    phone: '0414-1234567',
    email: 'maria.perez@email.com',
    enrollmentDate: '2025-09-01',
    address: 'Av. Principal, Calle 5, Casa 23',
  },
  {
    id: '2',
    firstName: 'Mateo',
    lastName: 'Gonzalez',
    fullName: 'Mateo Gonzalez',
    documentType: 'V',
    documentNumber: '27654321',
    document: 'V-27654321',
    birthDate: '2021-01-20',
    level: 'Preescolar',
    levelId: 'level-preescolar',
    classroom: 'Sala 3',
    classroomId: 'classroom-sala-3',
    monthlyFee: 35,
    currency: 'USD',
    status: 'withdrawn',
    guardian: 'Carlos Gonzalez',
    guardianId: 'rep-2',
    guardianRelationship: 'Padre',
    phone: '0414-5555678',
    email: 'carlos.gonzalez@email.com',
    enrollmentDate: '2025-09-01',
    address: 'Calle 8, Casa 45',
  },
  {
    id: '3',
    firstName: 'Valentina',
    lastName: 'Rojas',
    fullName: 'Valentina Rojas',
    documentType: 'V',
    documentNumber: '21223344',
    document: 'V-21223344',
    birthDate: '2020-07-10',
    level: 'Preescolar',
    levelId: 'level-preescolar',
    classroom: 'Sala 4',
    classroomId: 'classroom-sala-4',
    monthlyFee: 50,
    currency: 'USD',
    status: 'graduated',
    guardian: 'Ana Rojas',
    guardianId: 'rep-3',
    guardianRelationship: 'Madre',
    phone: '0416-5559012',
    email: 'ana.rojas@email.com',
    enrollmentDate: '2025-09-01',
    address: 'Urbanizacion El Parque, Casa 12',
  },
  {
    id: '4',
    firstName: 'Diego',
    lastName: 'Herrera',
    fullName: 'Diego Herrera',
    documentType: 'V',
    documentNumber: '24555678',
    document: 'V-24555678',
    birthDate: '2020-11-09',
    level: 'Preescolar',
    levelId: 'level-preescolar',
    classroom: 'Sala 5',
    classroomId: 'classroom-sala-5',
    monthlyFee: 45,
    currency: 'USD',
    status: 'active',
    guardian: 'Maria Perez',
    guardianId: 'rep-1',
    guardianRelationship: 'Madre',
    phone: '0414-1234567',
    email: 'maria.perez@email.com',
    enrollmentDate: '2025-09-01',
    address: 'Av. Principal, Calle 5, Casa 23',
  },
]

const mockState = {
  students: [...mockStudents],
  representatives: [...mockRepresentatives],
}

export const studentsKeys = {
  all: ['students'] as const,
  lists: () => [...studentsKeys.all, 'list'] as const,
  list: () => [...studentsKeys.lists()] as const,
  guardians: () => [...studentsKeys.all, 'guardians'] as const,
  levels: () => [...studentsKeys.all, 'levels'] as const,
  classrooms: () => [...studentsKeys.all, 'classrooms'] as const,
  detail: (id: string) => [...studentsKeys.all, 'detail', id] as const,
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const parseDocument = (value: string) => {
  const trimmed = value.trim()
  const match = trimmed.match(/^([A-Za-z]+)[-\s]?(.*)$/)

  if (!match || !match[2]) {
    return {
      documentType: 'cedula',
      documentNumber: trimmed,
    }
  }

  return {
    documentType: match[1].toUpperCase(),
    documentNumber: match[2].trim(),
  }
}

const formatDocument = (documentType?: string | null, documentNumber?: string | null) => {
  if (!documentNumber) return 'Sin documento'
  if (!documentType || documentType.toLowerCase() === 'cedula') return documentNumber
  return `${documentType}-${documentNumber}`
}

const formatError = (error: unknown) => {
  if (error instanceof Error) return error.message
  return 'Ocurrio un error inesperado al cargar alumnos.'
}

const toRepresentative = (record: {
  id: string
  full_name: string
  document_type?: string | null
  document_number?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}): Representative => ({
  id: record.id,
  fullName: record.full_name,
  documentType: record.document_type,
  documentNumber: record.document_number,
  document: formatDocument(record.document_type, record.document_number),
  phone: record.phone ?? 'Sin teléfono',
  email: record.email ?? 'Sin email',
  address: record.address ?? 'Sin dirección',
})

const mapStudentRecord = (record: {
  id: string
  first_name: string
  last_name: string
  birth_date?: string | null
  document_type?: string | null
  document_number?: string | null
  enrollment_date?: string | null
  status: Student['status']
  monthly_fee: number | string
  currency: 'USD' | 'VES'
  notes?: string | null
  classroom_id?: string | null
  level_id?: string | null
  student_level?: { id: string; name: string } | { id: string; name: string }[] | null
  primary_guardian_id?: string | null
  classrooms?: {
    id: string
    name: string
    level_id?: string | null
    levels?: { id: string; name: string } | { id: string; name: string }[] | null
  } | {
    id: string
    name: string
    level_id?: string | null
    levels?: { id: string; name: string } | { id: string; name: string }[] | null
  }[] | null
  guardians?: {
    id: string
    full_name: string
    document_type?: string | null
    document_number?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
  } | {
    id: string
    full_name: string
    document_type?: string | null
    document_number?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
  }[] | null
  student_guardians?: Array<{ guardian_id: string; relationship?: string | null; is_primary: boolean }> | null
}): Student => {
  const classroom = Array.isArray(record.classrooms) ? record.classrooms[0] : record.classrooms
  const guardian = Array.isArray(record.guardians) ? record.guardians[0] : record.guardians
  const classroomLevels = classroom?.levels
  const ownLevel = Array.isArray(record.student_level) ? record.student_level[0] : record.student_level
  const level = ownLevel ?? (Array.isArray(classroomLevels) ? classroomLevels[0] : classroomLevels)
  const primaryRelation = (record.student_guardians ?? []).find(
    (relation) => relation.is_primary && relation.guardian_id === record.primary_guardian_id,
  )

  return {
    id: record.id,
    firstName: record.first_name,
    lastName: record.last_name,
    fullName: `${record.first_name} ${record.last_name}`,
    documentType: record.document_type,
    documentNumber: record.document_number,
    document: formatDocument(record.document_type, record.document_number),
    birthDate: record.birth_date ?? '',
    level: level?.name ?? 'Sin nivel',
    levelId: record.level_id ?? classroom?.level_id ?? level?.id ?? null,
    classroom: classroom?.name ?? 'Sin salón',
    classroomId: record.classroom_id,
    monthlyFee: Number(record.monthly_fee ?? 0),
    currency: record.currency,
    status: record.status,
    guardian: guardian?.full_name ?? 'Sin representante',
    guardianId: record.primary_guardian_id,
    guardianRelationship: primaryRelation?.relationship ?? 'Representante',
    phone: guardian?.phone ?? 'Sin teléfono',
    email: guardian?.email ?? 'Sin email',
    enrollmentDate: record.enrollment_date ?? '',
    address: guardian?.address ?? 'Sin dirección',
    notes: record.notes,
  }
}

const fetchLevels = async (): Promise<LevelOption[]> => {
  if (!supabase) return mockLevels
  const { data, error } = await supabase.from('levels').select('id, name').eq('is_active', true).order('name')
  if (error) throw new Error(`No se pudieron cargar los niveles: ${error.message}`)
  return (data ?? []).map((level) => ({ id: level.id, name: level.name }))
}

const fetchClassrooms = async (): Promise<ClassroomOption[]> => {
  if (!supabase) return mockClassrooms
  const { data, error } = await supabase
    .from('classrooms')
    .select('id, name, level_id, levels ( id, name )')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(`No se pudieron cargar los salones: ${error.message}`)

  return (data ?? []).map((classroom) => {
    const level = Array.isArray(classroom.levels) ? classroom.levels[0] : classroom.levels
    return { id: classroom.id, name: classroom.name, levelId: classroom.level_id, levelName: level?.name ?? null }
  })
}

const fetchRepresentatives = async (): Promise<Representative[]> => {
  if (!supabase) return mockState.representatives
  const { data, error } = await supabase
    .from('guardians')
    .select('id, full_name, document_type, document_number, phone, email, address')
    .eq('is_active', true)
    .order('full_name')

  if (error) throw new Error(`No se pudieron cargar los representantes: ${error.message}`)
  return (data ?? []).map(toRepresentative)
}

const fetchStudents = async (): Promise<Student[]> => {
  if (!supabase) return mockState.students

  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      birth_date,
      document_type,
      document_number,
      enrollment_date,
      status,
      monthly_fee,
      currency,
      notes,
      classroom_id,
      level_id,
      student_level:levels!students_level_id_fkey ( id, name ),
      primary_guardian_id,
      classrooms (
        id,
        name,
        level_id,
        levels (
          id,
          name
        )
      ),
      guardians!students_primary_guardian_id_fkey (
        id,
        full_name,
        document_type,
        document_number,
        phone,
        email,
        address
      ),
      student_guardians (
        guardian_id,
        relationship,
        is_primary
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`No se pudieron cargar los alumnos: ${error.message}`)
  return (data ?? []).map((record) => mapStudentRecord(record as never))
}

const buildMockStudentDetail = (student: Student): StudentDetailRecord => {
  const obligations: StudentObligationRecord[] = [
    { id: `${student.id}-obl-1`, periodLabel: 'agosto 2026', amount: student.monthlyFee, amountPaid: student.monthlyFee, balance: 0, dueDate: '2026-08-05', status: 'paid' },
    { id: `${student.id}-obl-2`, periodLabel: 'septiembre 2026', amount: student.monthlyFee, amountPaid: 0, balance: student.monthlyFee, dueDate: '2026-09-05', status: 'pending' },
  ]
  const payments: StudentPaymentRecord[] = [
    { id: `${student.id}-pay-1`, receiptNumber: 'REC-MOCK-001', conceptName: 'Mensualidad', amount: student.monthlyFee, currency: student.currency, paymentMethod: 'transfer', referenceNumber: 'REF-MOCK-01', paymentDate: '2026-08-03', status: 'active', registeredBy: 'Administrador' },
  ]
  const guardians: StudentGuardianRecord[] = [{
    id: student.guardianId ?? `rep-${student.id}`,
    fullName: student.guardian,
    document: 'Sin documento',
    phone: student.phone,
    email: student.email,
    address: student.address,
    relationship: student.guardianRelationship,
    isPrimary: true,
  }]
  const history: StudentHistoryRecord[] = [{ id: `${student.id}-his-1`, createdAt: '2026-08-01T10:30:00Z', action: 'update', entity: 'students', notes: 'Registro actualizado.', userName: 'Sistema' }]

  return {
    student,
    obligations,
    payments,
    guardians,
    history,
    financialSummary: {
      pendingBalance: obligations.reduce((sum, item) => sum + item.balance, 0),
      paidThisYear: payments.reduce((sum, item) => sum + item.amount, 0),
      nextDueDate: obligations.find((item) => item.balance > 0)?.dueDate ?? null,
    },
  }
}

const fetchStudentDetail = async (id: string): Promise<StudentDetailRecord | null> => {
  if (!id) return null
  if (!supabase) {
    const student = mockState.students.find((item) => item.id === id)
    return student ? buildMockStudentDetail(student) : null
  }

  const [studentResult, obligationsResult, paymentsResult, guardiansResult, historyResult] = await Promise.all([
    supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        birth_date,
        document_type,
        document_number,
        enrollment_date,
        status,
        monthly_fee,
        currency,
        notes,
        classroom_id,
        level_id,
        student_level:levels!students_level_id_fkey ( id, name ),
        primary_guardian_id,
        classrooms (
          id,
          name,
          level_id,
          levels (
            id,
            name
          )
        ),
        guardians!students_primary_guardian_id_fkey (
          id,
          full_name,
          document_type,
          document_number,
          phone,
          email,
          address
        ),
        student_guardians (
          guardian_id,
          relationship,
          is_primary
        )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('tuition_obligations')
      .select('id, amount, amount_paid, due_date, status, tuition_periods ( period_year, period_month )')
      .eq('student_id', id)
      .order('due_date', { ascending: false }),
    supabase
      .from('payments')
      .select('id, receipt_number, amount, currency, payment_method, reference_number, payment_date, status, payment_concepts ( name ), profiles!payments_registered_by_fkey ( full_name )')
      .eq('student_id', id)
      .order('payment_date', { ascending: false }),
    supabase
      .from('student_guardians')
      .select('guardian_id, relationship, is_primary, guardians ( id, full_name, document_type, document_number, phone, email, address )')
      .eq('student_id', id),
    supabase
      .from('audit_logs')
      .select('id, created_at, action, entity, entity_id, notes, profiles ( full_name )')
      .eq('entity', 'students')
      .eq('entity_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (studentResult.error) throw new Error(`No se pudo cargar el alumno: ${studentResult.error.message}`)
  if (obligationsResult.error) throw new Error(`No se pudieron cargar las mensualidades: ${obligationsResult.error.message}`)
  if (paymentsResult.error) throw new Error(`No se pudieron cargar los pagos: ${paymentsResult.error.message}`)
  if (guardiansResult.error) throw new Error(`No se pudieron cargar los representantes: ${guardiansResult.error.message}`)
  if (historyResult.error) throw new Error(`No se pudo cargar el historial: ${historyResult.error.message}`)

  const student = mapStudentRecord(studentResult.data as never)

  const obligations: StudentObligationRecord[] = (obligationsResult.data ?? []).map((row) => {
    const period = Array.isArray(row.tuition_periods) ? row.tuition_periods[0] : row.tuition_periods
    const amount = Number(row.amount ?? 0)
    const amountPaid = Number(row.amount_paid ?? 0)
    const date = period ? new Date(period.period_year, period.period_month - 1, 1) : null
    const periodLabel = date
      ? new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' }).format(date)
      : 'Sin periodo'

    return {
      id: row.id,
      periodLabel,
      amount,
      amountPaid,
      balance: Math.max(0, amount - amountPaid),
      dueDate: row.due_date,
      status: row.status,
    }
  })

  const payments: StudentPaymentRecord[] = (paymentsResult.data ?? []).map((row) => {
    const concept = Array.isArray(row.payment_concepts) ? row.payment_concepts[0] : row.payment_concepts
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      receiptNumber: row.receipt_number ?? 'Sin recibo',
      conceptName: concept?.name ?? 'Sin concepto',
      amount: Number(row.amount ?? 0),
      currency: row.currency,
      paymentMethod: row.payment_method,
      referenceNumber: row.reference_number,
      paymentDate: row.payment_date,
      status: row.status,
      registeredBy: profile?.full_name ?? null,
    }
  })

  const guardians: StudentGuardianRecord[] = (guardiansResult.data ?? []).map((row) => {
    const guardian = Array.isArray(row.guardians) ? row.guardians[0] : row.guardians
    return {
      id: guardian?.id ?? row.guardian_id,
      fullName: guardian?.full_name ?? 'Representante',
      documentType: guardian?.document_type,
      documentNumber: guardian?.document_number,
      document: formatDocument(guardian?.document_type, guardian?.document_number),
      phone: guardian?.phone ?? 'Sin teléfono',
      email: guardian?.email ?? 'Sin email',
      address: guardian?.address ?? 'Sin dirección',
      relationship: row.relationship ?? 'Representante',
      isPrimary: row.is_primary,
    }
  })

  const history: StudentHistoryRecord[] = (historyResult.data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      createdAt: row.created_at,
      action: row.action,
      entity: row.entity,
      notes: row.notes,
      userName: profile?.full_name ?? 'Usuario no disponible',
    }
  })

  const currentYear = appCurrentDate.getFullYear()
  const paidThisYear = payments
    .filter((payment) => new Date(`${payment.paymentDate}T00:00:00`).getFullYear() === currentYear && payment.status === 'active')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const pendingBalance = obligations.reduce((sum, item) => sum + item.balance, 0)
  const nextDueDate = obligations
    .filter((item) => item.balance > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate ?? null

  return {
    student,
    obligations,
    payments,
    guardians,
    history,
    financialSummary: { pendingBalance, paidThisYear, nextDueDate },
  }
}

const createGuardian = async (input: NewGuardianInput) => {
  const { documentType, documentNumber } = parseDocument(input.document)
  const contact = guardianContactPayload(input)

  if (!supabase) {
    const representative: Representative = {
      id: `rep-${Date.now()}`,
      fullName: input.fullName.trim(),
      documentType,
      documentNumber,
      document: formatDocument(documentType, documentNumber),
      phone: contact.phone,
      email: contact.email ?? '',
      address: input.address.trim(),
      relationship: input.relationship?.trim() || 'Representante',
    }

    mockState.representatives = [representative, ...mockState.representatives]
    return representative
  }

  const { data, error } = await supabase
    .from('guardians')
    .insert({
      full_name: input.fullName.trim(),
      document_type: documentType,
      document_number: documentNumber,
      ...contact,
      address: input.address.trim(),
    })
    .select('id, full_name, document_type, document_number, phone, email, address')
    .single()

  if (error) throw new Error(`No se pudo registrar el representante: ${error.message}`)

  return {
    ...toRepresentative(data),
    relationship: input.relationship?.trim() || 'Representante',
  }
}

const createStudent = async (input: StudentFormValues) => {
  const guardian = input.newGuardian ? await createGuardian(input.newGuardian) : undefined
  const guardianId = guardian?.id ?? input.guardianId

  if (!guardianId) throw new Error('Debes seleccionar un representante o registrar uno nuevo.')

  const relationship = guardian?.relationship ?? input.newGuardian?.relationship ?? 'Representante'
  const { documentType, documentNumber } = parseDocument(input.document)

  if (!supabase) {
    const classroom = mockClassrooms.find((item) => item.id === input.classroomId)
    const level = mockLevels.find((item) => item.id === input.levelId)
    const representative = guardian ?? mockState.representatives.find((item) => item.id === guardianId)

    if (!representative) throw new Error('No se pudo resolver el representante seleccionado.')

    const student: Student = {
      id: String(Date.now()),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
      documentType,
      documentNumber,
      document: formatDocument(documentType, documentNumber),
      birthDate: input.birthDate,
      level: level?.name ?? 'Sin nivel',
      levelId: input.levelId,
      classroom: classroom?.name ?? 'Sin salón',
      classroomId: input.classroomId,
      monthlyFee: input.monthlyFee,
      currency: input.currency,
      status: 'active',
      guardian: representative.fullName,
      guardianId,
      guardianRelationship: relationship,
      phone: representative.phone,
      email: representative.email,
      enrollmentDate: input.enrollmentDate,
      address: representative.address,
    }

    mockState.students = [student, ...mockState.students]
    return student
  }

  const { data: studentRecord, error: studentError } = await supabase
    .from('students')
    .insert({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      document_type: documentType,
      document_number: documentNumber,
      birth_date: input.birthDate,
      enrollment_date: input.enrollmentDate,
      classroom_id: input.classroomId,
      level_id: input.levelId,
      monthly_fee: input.monthlyFee,
      currency: input.currency,
      status: 'active',
      primary_guardian_id: guardianId,
    })
    .select('id')
    .single()

  if (studentError) throw new Error(`No se pudo registrar el alumno: ${studentError.message}`)

  const { error: relationError } = await supabase.from('student_guardians').insert({
    student_id: studentRecord.id,
    guardian_id: guardianId,
    relationship,
    is_primary: true,
  })

  if (relationError) throw new Error(`El alumno se creo, pero fallo la relacion con el representante: ${relationError.message}`)
}

const updateStudent = async ({ id, values }: { id: string; values: StudentFormValues }) => {
  const guardian = values.newGuardian ? await createGuardian(values.newGuardian) : undefined
  const guardianId = guardian?.id ?? values.guardianId

  if (!guardianId) throw new Error('Debes seleccionar un representante o registrar uno nuevo.')

  const relationship = guardian?.relationship ?? values.newGuardian?.relationship ?? 'Representante'
  const { documentType, documentNumber } = parseDocument(values.document)

  if (!supabase) {
    const representative = guardian ?? mockState.representatives.find((item) => item.id === guardianId)
    const classroom = mockClassrooms.find((item) => item.id === values.classroomId)
    const level = mockLevels.find((item) => item.id === values.levelId)
    if (!representative) throw new Error('No se pudo resolver el representante seleccionado.')

    mockState.students = mockState.students.map((student) =>
      student.id === id
        ? {
            ...student,
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            fullName: `${values.firstName.trim()} ${values.lastName.trim()}`,
            documentType,
            documentNumber,
            document: formatDocument(documentType, documentNumber),
            birthDate: values.birthDate,
            level: level?.name ?? 'Sin nivel',
            levelId: values.levelId,
            classroom: classroom?.name ?? 'Sin salón',
            classroomId: values.classroomId,
            monthlyFee: values.monthlyFee,
            currency: values.currency,
            guardian: representative.fullName,
            guardianId,
            guardianRelationship: relationship,
            phone: representative.phone,
            email: representative.email,
            enrollmentDate: values.enrollmentDate,
            address: representative.address,
          }
        : student,
    )
    return
  }

  const { error: studentError } = await supabase
    .from('students')
    .update({
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      document_type: documentType,
      document_number: documentNumber,
      birth_date: values.birthDate,
      enrollment_date: values.enrollmentDate,
      classroom_id: values.classroomId,
      level_id: values.levelId,
      monthly_fee: values.monthlyFee,
      currency: values.currency,
      primary_guardian_id: guardianId,
    })
    .eq('id', id)

  if (studentError) throw new Error(`No se pudo actualizar el alumno: ${studentError.message}`)

  const { error: relationsResetError } = await supabase
    .from('student_guardians')
    .update({ is_primary: false })
    .eq('student_id', id)

  if (relationsResetError) throw new Error(`Se actualizo el alumno, pero fallo el recambio de representantes: ${relationsResetError.message}`)

  const { data: existingRelation, error: relationLookupError } = await supabase
    .from('student_guardians')
    .select('student_id, guardian_id')
    .eq('student_id', id)
    .eq('guardian_id', guardianId)
    .maybeSingle()

  if (relationLookupError) throw new Error(`No se pudo verificar la relacion con el representante: ${relationLookupError.message}`)

  if (existingRelation) {
    const { error: relationUpdateError } = await supabase
      .from('student_guardians')
      .update({ relationship, is_primary: true })
      .eq('student_id', id)
      .eq('guardian_id', guardianId)

    if (relationUpdateError) throw new Error(`No se pudo actualizar la relacion con el representante: ${relationUpdateError.message}`)
  } else {
    const { error: relationInsertError } = await supabase.from('student_guardians').insert({
      student_id: id,
      guardian_id: guardianId,
      relationship,
      is_primary: true,
    })

    if (relationInsertError) throw new Error(`No se pudo vincular el nuevo representante al alumno: ${relationInsertError.message}`)
  }
}

export const useStudents = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classroomFilter, setClassroomFilter] = useState('all')

  const studentsQuery = useQuery({ queryKey: studentsKeys.list(), queryFn: fetchStudents })
  const representativesQuery = useQuery({ queryKey: studentsKeys.guardians(), queryFn: fetchRepresentatives })
  const levelsQuery = useQuery({ queryKey: studentsKeys.levels(), queryFn: fetchLevels })
  const classroomsQuery = useQuery({ queryKey: studentsKeys.classrooms(), queryFn: fetchClassrooms })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: studentsKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['guardians'] }),
      queryClient.invalidateQueries({ queryKey: ['payments'] }),
      queryClient.invalidateQueries({ queryKey: ['tuition'] }),
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
  }

  const createStudentMutation = useMutation({ mutationFn: createStudent, onSuccess: invalidateAll })
  const updateStudentMutation = useMutation({ mutationFn: updateStudent, onSuccess: invalidateAll })

  const allStudents = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data])
  const representatives = representativesQuery.data ?? []
  const levels = levelsQuery.data ?? mockLevels
  const classrooms = classroomsQuery.data ?? mockClassrooms

  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      const term = normalize(search)
      const matchesSearch =
        term.length === 0 ||
        normalize(student.fullName).includes(term) ||
        normalize(student.document).includes(term) ||
        normalize(student.guardian).includes(term)

      const matchesStatus = statusFilter === 'all' || student.status === statusFilter
      const matchesClassroom = classroomFilter === 'all' || student.classroom === classroomFilter

      return matchesSearch && matchesStatus && matchesClassroom
    })
  }, [allStudents, search, statusFilter, classroomFilter])

  const searchRepresentatives = (term: string) => {
    const normalized = normalize(term)
    if (!normalized) return []

    return representatives.filter((representative) => {
      return [representative.fullName, representative.document, representative.phone, representative.email].some((value) => normalize(value).includes(normalized))
    })
  }

  const getRepresentative = (id: string) => representatives.find((representative) => representative.id === id)
  const getStudent = (id: string) => allStudents.find((student) => student.id === id)

  const summary = {
    total: allStudents.length,
    active: allStudents.filter((student) => student.status === 'active').length,
    withdrawn: allStudents.filter((student) => student.status === 'withdrawn').length,
    graduated: allStudents.filter((student) => student.status === 'graduated').length,
  }

  const loadError = studentsQuery.error ?? representativesQuery.error ?? levelsQuery.error ?? classroomsQuery.error

  return {
    students: filteredStudents,
    allStudents,
    representatives,
    levels,
    classrooms,
    isLoading: studentsQuery.isLoading || representativesQuery.isLoading || levelsQuery.isLoading || classroomsQuery.isLoading,
    isSaving: createStudentMutation.isPending || updateStudentMutation.isPending,
    isUsingMockData: !supabase,
    loadError: loadError ? formatError(loadError) : null,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    classroomFilter,
    setClassroomFilter,
    addStudent: createStudentMutation.mutateAsync,
    updateStudent: updateStudentMutation.mutateAsync,
    searchRepresentatives,
    getRepresentative,
    getStudent,
    totalCount: filteredStudents.length,
    hasActiveFilters: Boolean(search) || statusFilter !== 'all' || classroomFilter !== 'all',
    clearFilters: () => {
      setSearch('')
      setStatusFilter('all')
      setClassroomFilter('all')
    },
    summary,
  }
}

export const useStudentDetail = (id: string | undefined) =>
  useQuery({
    queryKey: studentsKeys.detail(id ?? 'missing'),
    queryFn: () => fetchStudentDetail(id ?? ''),
    enabled: Boolean(id),
  })




