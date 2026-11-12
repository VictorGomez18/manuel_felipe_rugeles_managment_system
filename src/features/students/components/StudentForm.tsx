import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpenText, CalendarDays, CircleDollarSign, Mail, MapPin, Phone, UserRound, Users, X } from 'lucide-react'
import { CurrencyInput } from '../../../components/ui/CurrencyInput'
import { FormSection } from '../../../components/ui/FormSection'
import { Input } from '../../../components/ui/Input'
import { SearchEntityInput } from '../../../components/ui/SearchEntityInput'
import { Select } from '../../../components/ui/Select'
import { cn } from '../../../lib/utils'
import { useStudents } from '../hooks/useStudents'
import { guardianEmailSchema, guardianPhoneSchema, phoneError } from '../../guardians/contactValidation'
import type { StudentFormValues } from '../types'

const studentSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/, 'El nombre solo puede contener letras'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/, 'El apellido solo puede contener letras'),
  document: z.string().optional(),
  birthDate: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  levelId: z.string().min(1, 'Selecciona un nivel'),
  classroomId: z.string().min(1, 'Selecciona un salón'),
  monthlyFee: z.number().positive('La mensualidad debe ser mayor a cero'),
  currency: z.enum(['USD', 'VES']),
  enrollmentDate: z.string().min(1, 'La fecha de ingreso es obligatoria'),
  representativeMode: z.enum(['existing', 'new']),
  newGuardianName: z.string().optional(),
  newGuardianDocument: z.string().optional(),
  newGuardianPhone: z.string().optional(),
  newGuardianEmail: z.string().optional(),
  newGuardianAddress: z.string().optional(),
  newGuardianRelationship: z.string().optional(),
}).superRefine((value, context) => {
  if (value.representativeMode === 'new') {
    if (!value.newGuardianName || value.newGuardianName.length < 3) context.addIssue({ code: 'custom', path: ['newGuardianName'], message: 'El nombre del representante es obligatorio' })
    if (!value.newGuardianDocument || value.newGuardianDocument.length < 5) context.addIssue({ code: 'custom', path: ['newGuardianDocument'], message: 'El documento es obligatorio' })
    if (!guardianPhoneSchema.safeParse(value.newGuardianPhone).success) context.addIssue({ code: 'custom', path: ['newGuardianPhone'], message: phoneError })
    if (!guardianEmailSchema.safeParse(value.newGuardianEmail ?? '').success) context.addIssue({ code: 'custom', path: ['newGuardianEmail'], message: 'El email no es válido' })
    if (!value.newGuardianAddress || value.newGuardianAddress.length < 5) context.addIssue({ code: 'custom', path: ['newGuardianAddress'], message: 'La dirección es obligatoria' })
  }
})

type StudentSchemaValues = z.infer<typeof studentSchema>

interface StudentFormProps {
  onSubmit: (data: StudentFormValues) => Promise<void> | void
  initialData?: Partial<StudentSchemaValues>
  initialRepresentativeId?: string | null
  initialRepresentativeLabel?: string
  formId?: string
}

export const StudentForm = ({ onSubmit, initialData, initialRepresentativeId, initialRepresentativeLabel = '', formId = 'student-form' }: StudentFormProps) => {
  const { searchRepresentatives, representatives, levels, classrooms, isLoading } = useStudents()
  const [representativeQuery, setRepresentativeQuery] = useState(initialRepresentativeLabel)
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState<string | null>(initialRepresentativeId ?? null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<StudentSchemaValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      currency: 'USD',
      representativeMode: 'existing',
      monthlyFee: 0,
      levelId: '',
      classroomId: '',
      ...initialData,
    },
  })

  const representativeMode = useWatch({ control, name: 'representativeMode' })
  const monthlyFee = useWatch({ control, name: 'monthlyFee' })
  const matches = representativeQuery ? searchRepresentatives(representativeQuery).slice(0, 5) : []
  const selectedRepresentative = useMemo(() => representatives.find((item) => item.id === selectedRepresentativeId) ?? null, [representatives, selectedRepresentativeId])

  useEffect(() => {
    if (levels.length > 0 && !getValues('levelId')) {
      setValue('levelId', levels[0].id)
    }
  }, [getValues, levels, setValue])

  useEffect(() => {
    const currentClassroomId = getValues('classroomId')
    const classroomStillValid = classrooms.some((classroom) => classroom.id === currentClassroomId)

    if (!classroomStillValid) {
      setValue('classroomId', classrooms[0]?.id ?? '')
    }
  }, [classrooms, getValues, setValue])

  const activateExistingMode = () => {
    setValue('representativeMode', 'existing')
  }

  const activateNewMode = () => {
    setValue('representativeMode', 'new')
    setSelectedRepresentativeId(null)
    setRepresentativeQuery('')
  }

  const submitStudent = async (values: StudentSchemaValues) => {
    if (values.representativeMode === 'existing' && !selectedRepresentative) {
      setSubmitError('Selecciona un representante existente o registra uno nuevo.')
      return
    }

    if (!levels.some((level) => level.id === values.levelId) || !classrooms.some((classroom) => classroom.id === values.classroomId)) {
      setSubmitError('Selecciona un nivel y un sal\u00f3n disponibles.')
      return
    }

    setSubmitError(null)

    await onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      document: values.document ?? '',
      birthDate: values.birthDate,
      levelId: values.levelId,
      classroomId: values.classroomId,
      monthlyFee: values.monthlyFee,
      currency: values.currency,
      enrollmentDate: values.enrollmentDate,
      guardianId: values.representativeMode === 'existing' ? selectedRepresentative?.id : undefined,
      newGuardian: values.representativeMode === 'new'
        ? {
            fullName: values.newGuardianName!.trim(),
            document: values.newGuardianDocument!.trim(),
            phone: values.newGuardianPhone!.trim(),
            email: values.newGuardianEmail?.trim() ?? '',
            address: values.newGuardianAddress!.trim(),
            relationship: values.newGuardianRelationship?.trim() || 'Representante',
          }
        : undefined,
    })
  }

  const selectedOption = selectedRepresentative
    ? { id: selectedRepresentative.id, title: selectedRepresentative.fullName, subtitle: `${selectedRepresentative.document} · ${selectedRepresentative.phone}`, meta: selectedRepresentative.relationship }
    : null

  return (
    <form id={formId} onSubmit={handleSubmit(submitStudent)} className="space-y-6">
      <FormSection icon={<Users className="h-5 w-5" />} title="Datos personales" description="Información básica del estudiante para su registro inicial.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Nombre</label><Input {...register('firstName')} error={!!errors.firstName} placeholder="Sofia" />{errors.firstName ? <p className="mt-1.5 text-xs text-danger">{errors.firstName.message}</p> : null}</div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Apellido</label><Input {...register('lastName')} error={!!errors.lastName} placeholder="Perez" />{errors.lastName ? <p className="mt-1.5 text-xs text-danger">{errors.lastName.message}</p> : null}</div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Identificador del alumno <span className="font-normal text-neutral-400">(opcional)</span></label><Input {...register('document')} placeholder="Expediente, partida o codigo interno" error={!!errors.document} /><p className="mt-1.5 text-xs text-neutral-500">No se solicita cedula a los alumnos.</p></div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Fecha de nacimiento</label><Input type="date" {...register('birthDate')} error={!!errors.birthDate} rightIcon={<CalendarDays className="h-4 w-4" />} />{errors.birthDate ? <p className="mt-1.5 text-xs text-danger">{errors.birthDate.message}</p> : null}</div>
        </div>
      </FormSection>

      {submitError ? <p className="text-xs text-danger">{submitError}</p> : null}
      <FormSection icon={<BookOpenText className="h-5 w-5" />} title="Información académica" description="Selecciona el nivel, salón y fecha de ingreso del alumno.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Nivel</label><Select {...register('levelId')} error={!!errors.levelId} disabled={isLoading || levels.length === 0}>{levels.length === 0 ? <option value="">Sin niveles disponibles</option> : null}{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</Select>{errors.levelId ? <p className="mt-1.5 text-xs text-danger">{errors.levelId.message}</p> : null}</div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Salón</label><Select {...register('classroomId')} error={!!errors.classroomId} disabled={isLoading || classrooms.length === 0}>{classrooms.length === 0 ? <option value="">Sin salones disponibles</option> : null}{classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}</Select>{errors.classroomId ? <p className="mt-1.5 text-xs text-danger">{errors.classroomId.message}</p> : null}</div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Fecha de ingreso</label><Input type="date" {...register('enrollmentDate')} error={!!errors.enrollmentDate} rightIcon={<CalendarDays className="h-4 w-4" />} />{errors.enrollmentDate ? <p className="mt-1.5 text-xs text-danger">{errors.enrollmentDate.message}</p> : null}</div>
        </div>
      </FormSection>

      <FormSection icon={<CircleDollarSign className="h-5 w-5" />} title="Información financiera" description="La mensualidad se almacena en la ficha del alumno y alimenta las obligaciones futuras.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Mensualidad</label><CurrencyInput id="monthlyFee" name="monthlyFee" value={monthlyFee} onChange={(value) => setValue('monthlyFee', value, { shouldDirty: true, shouldValidate: true })} error={!!errors.monthlyFee} />{errors.monthlyFee ? <p className="mt-1.5 text-xs text-danger">{errors.monthlyFee.message}</p> : null}</div>
          <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Moneda</label><Select {...register('currency')}><option value="USD">USD</option><option value="VES">VES</option></Select></div>
        </div>
      </FormSection>

      <FormSection icon={<UserRound className="h-5 w-5" />} title="Representante principal" description="Busca primero un representante existente. Si no existe, registralo sin salir del drawer.">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-25 p-1"><div className="grid grid-cols-2 gap-1"><button type="button" onClick={activateExistingMode} className={cn('focus-ring rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150', representativeMode === 'existing' ? 'bg-white text-primary shadow-xs' : 'text-neutral-500 hover:text-neutral-800')}>Buscar existente</button><button type="button" onClick={activateNewMode} className={cn('focus-ring rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150', representativeMode === 'new' ? 'bg-white text-primary shadow-xs' : 'text-neutral-500 hover:text-neutral-800')}>Registrar nuevo</button></div></div>

        {representativeMode === 'existing' ? (
          <div className="space-y-4">
            <SearchEntityInput
              label="Buscar representante existente"
              placeholder="Buscar por nombre, documento o teléfono..."
              query={representativeQuery}
              onQueryChange={setRepresentativeQuery}
              results={matches.map((representative) => ({ id: representative.id, title: representative.fullName, subtitle: `${representative.document} · ${representative.phone}`, meta: representative.relationship }))}
              emptyState={representatives.length === 0 ? 'No hay representantes disponibles todavia.' : 'No se encontraron coincidencias.'}
              selected={selectedOption}
              onSelect={(option) => {
                const representative = representatives.find((item) => item.id === option.id)
                if (!representative) return
                setSelectedRepresentativeId(representative.id)
                setRepresentativeQuery(representative.fullName)
              }}
              selectionSlot={selectedRepresentative ? (
                <div className="rounded-2xl border border-primary/15 bg-primary-lighter/40 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{selectedRepresentative.fullName}</p>
                      <p className="mt-1 text-sm text-neutral-600">{selectedRepresentative.document}</p>
                      <p className="text-sm text-neutral-600">{selectedRepresentative.phone}</p>
                      <p className="text-sm text-neutral-600">{selectedRepresentative.email}</p>
                    </div>
                    <button type="button" aria-label="Quitar representante seleccionado" onClick={() => { setSelectedRepresentativeId(null); setRepresentativeQuery('') }} className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-white hover:text-neutral-700"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/70 bg-white/75 px-3 py-2"><span className="text-xs font-medium uppercase tracking-[0.14em] text-primary/70">Representante seleccionado</span><span className="text-xs text-neutral-500">{selectedRepresentative.relationship ?? 'Representante'}</span></div>
                </div>
              ) : null}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Nombre completo</label><Input {...register('newGuardianName')} error={!!errors.newGuardianName} placeholder="Maria Perez" />{errors.newGuardianName ? <p className="mt-1.5 text-xs text-danger">{errors.newGuardianName.message}</p> : null}</div>
            <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Documento</label><Input {...register('newGuardianDocument')} error={!!errors.newGuardianDocument} placeholder="V-12345678" />{errors.newGuardianDocument ? <p className="mt-1.5 text-xs text-danger">{errors.newGuardianDocument.message}</p> : null}</div>
            <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Teléfono</label><Input type="tel" inputMode="tel" {...register('newGuardianPhone')} error={!!errors.newGuardianPhone} placeholder="0414-1234567" rightIcon={<Phone className="h-4 w-4" />} />{errors.newGuardianPhone ? <p className="mt-1.5 text-xs text-danger">{errors.newGuardianPhone.message}</p> : null}</div>
            <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Email (opcional)</label><Input type="email" {...register('newGuardianEmail')} error={!!errors.newGuardianEmail} placeholder="correo@email.com" rightIcon={<Mail className="h-4 w-4" />} />{errors.newGuardianEmail ? <p className="mt-1.5 text-xs text-danger">{errors.newGuardianEmail.message}</p> : null}</div>
            <div><label className="mb-1.5 block text-sm font-medium text-neutral-700">Parentesco</label><Input {...register('newGuardianRelationship')} placeholder="Madre" /></div>
            <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-medium text-neutral-700">Dirección</label><Input {...register('newGuardianAddress')} error={!!errors.newGuardianAddress} placeholder="Av. Principal, Calle 5, Casa 23" rightIcon={<MapPin className="h-4 w-4" />} />{errors.newGuardianAddress ? <p className="mt-1.5 text-xs text-danger">{errors.newGuardianAddress.message}</p> : null}</div>
          </div>
        )}
      </FormSection>

      <button type="submit" className="hidden" aria-hidden="true" disabled={isSubmitting}>Submit</button>
    </form>
  )
}







