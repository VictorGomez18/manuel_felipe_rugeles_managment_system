import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CircleDollarSign, FileText } from 'lucide-react'
import { CurrencyInput } from '../../../components/ui/CurrencyInput'
import { FormSection } from '../../../components/ui/FormSection'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import type { PaymentFormValues } from '../types'

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Selecciona un alumno'),
  guardianId: z.string().min(1, 'Selecciona un representante'),
  conceptId: z.string().optional(),
  amount: z.number().positive('El monto debe ser mayor a cero'),
  currency: z.enum(['USD', 'VES']),
  paymentMethod: z.string().min(1, 'Selecciona un método'),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().min(1, 'La fecha es obligatoria'),
  notes: z.string().optional(),
})

type PaymentSchemaValues = z.infer<typeof paymentSchema>

export const PaymentForm = ({
  onSubmit,
  students,
  concepts,
  methods,
  defaultStudentId,
  pendingDebt,
  formId = 'payment-form',
}: {
  onSubmit: (values: PaymentFormValues) => Promise<void> | void
  students: Array<{ id: string; label: string; guardianId?: string | null; monthlyFee: number; currency: 'USD' | 'VES' }>
  concepts: Array<{ id: string; label: string }>
  methods: Array<{ value: string; label: string }>
  defaultStudentId?: string
  pendingDebt: number
  formId?: string
}) => {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentSchemaValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: defaultStudentId ?? '',
      guardianId: students.find((student) => student.id === defaultStudentId)?.guardianId ?? '',
      currency: students.find((student) => student.id === defaultStudentId)?.currency ?? 'USD',
      paymentDate: '2026-08-29',
      amount: 0,
    },
  })

  const selectedStudentId = useWatch({ control, name: 'studentId' })
  const amount = useWatch({ control, name: 'amount' })
  const selectedStudent = students.find((student) => student.id === selectedStudentId)

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values)
      })}
      className="space-y-6"
    >
      <FormSection icon={<CircleDollarSign className="h-5 w-5" />} title="Registrar pago" description="El pago se aplicara a las mensualidades pendientes del alumno.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Alumno</label>
            <Select
              {...register('studentId')}
              error={!!errors.studentId}
              onChange={(event) => {
                const nextStudent = students.find((student) => student.id === event.target.value)
                setValue('studentId', event.target.value)
                setValue('guardianId', nextStudent?.guardianId ?? '')
                setValue('currency', nextStudent?.currency ?? 'USD')
              }}
            >
              <option value="">Selecciona un alumno</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
            </Select>
            {errors.studentId ? <p className="mt-1.5 text-xs text-danger">{errors.studentId.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Representante</label>
            <input type="hidden" {...register('guardianId')} />
            <Input value={selectedStudent ? 'Representante principal asociado' : ''} disabled error={!!errors.guardianId} placeholder="Se asigna desde el alumno" />
            {errors.guardianId ? <p className="mt-1.5 text-xs text-danger">{errors.guardianId.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Concepto</label>
            <Select {...register('conceptId')}>
              <option value="">Sin concepto</option>
              {concepts.map((concept) => <option key={concept.id} value={concept.id}>{concept.label}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Método</label>
            <Select {...register('paymentMethod')} error={!!errors.paymentMethod}>
              <option value="">Selecciona un método</option>
              {methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
            </Select>
            {errors.paymentMethod ? <p className="mt-1.5 text-xs text-danger">{errors.paymentMethod.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Monto</label>
            <CurrencyInput id="payment-amount" name="amount" value={amount ?? 0} onChange={(value) => setValue('amount', value, { shouldDirty: true, shouldValidate: true })} error={!!errors.amount} />
            {errors.amount ? <p className="mt-1.5 text-xs text-danger">{errors.amount.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Moneda</label>
            <Select {...register('currency')}>
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Referencia</label>
            <Input {...register('referenceNumber')} placeholder="Número de referencia" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Fecha</label>
            <Input type="date" {...register('paymentDate')} error={!!errors.paymentDate} />
            {errors.paymentDate ? <p className="mt-1.5 text-xs text-danger">{errors.paymentDate.message}</p> : null}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Notas</label>
            <Input {...register('notes')} placeholder="Observaciones del pago" rightIcon={<FileText className="h-4 w-4" />} />
          </div>
        </div>
      </FormSection>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-25 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Deuda actual</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">USD {pendingDebt.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Monto del pago</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">USD {(amount ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-primary-lighter/35 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">Saldo aproximado</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">USD {Math.max(0, pendingDebt - (amount ?? 0)).toFixed(2)}</p>
        </div>
      </div>

      <button type="submit" className="hidden" aria-hidden="true" disabled={isSubmitting}>Submit</button>
    </form>
  )
}



