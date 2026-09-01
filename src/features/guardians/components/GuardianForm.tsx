import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { FormSection } from '../../../components/ui/FormSection'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import type { GuardianFormValues } from '../types'

const guardianSchema = z.object({
  fullName: z.string().min(3, 'El nombre es obligatorio'),
  document: z.string().min(5, 'El documento es obligatorio'),
  phone: z.string().min(7, 'El telefono es obligatorio'),
  email: z.string().email('El correo no es valido'),
  address: z.string().min(5, 'La direccion es obligatoria'),
  notes: z.string().optional(),
  isActive: z.enum(['true', 'false']),
})

type GuardianSchemaValues = z.infer<typeof guardianSchema>

interface GuardianFormProps {
  onSubmit: (values: GuardianFormValues) => Promise<void> | void
  initialValues?: GuardianFormValues
  formId?: string
}

export const GuardianForm = ({ onSubmit, initialValues, formId = 'guardian-form' }: GuardianFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuardianSchemaValues>({
    resolver: zodResolver(guardianSchema),
    defaultValues: initialValues
      ? { ...initialValues, isActive: initialValues.isActive ? 'true' : 'false' }
      : { isActive: 'true' },
  })

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          fullName: values.fullName,
          document: values.document,
          phone: values.phone,
          email: values.email,
          address: values.address,
          notes: values.notes,
          isActive: values.isActive === 'true',
        })
      })}
      className="space-y-6"
    >
      <FormSection icon={<UserRound className="h-5 w-5" />} title="Datos del representante" description="Informacion principal para contacto y gestion administrativa.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nombre completo</label>
            <Input {...register('fullName')} error={!!errors.fullName} placeholder="Maria Perez" />
            {errors.fullName ? <p className="mt-1.5 text-xs text-danger">{errors.fullName.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Documento</label>
            <Input {...register('document')} error={!!errors.document} placeholder="V-12345678" />
            {errors.document ? <p className="mt-1.5 text-xs text-danger">{errors.document.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Telefono</label>
            <Input {...register('phone')} error={!!errors.phone} placeholder="0414-1234567" rightIcon={<Phone className="h-4 w-4" />} />
            {errors.phone ? <p className="mt-1.5 text-xs text-danger">{errors.phone.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
            <Input type="email" {...register('email')} error={!!errors.email} placeholder="correo@email.com" rightIcon={<Mail className="h-4 w-4" />} />
            {errors.email ? <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p> : null}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Direccion</label>
            <Input {...register('address')} error={!!errors.address} placeholder="Av. Principal, Calle 5, Casa 23" rightIcon={<MapPin className="h-4 w-4" />} />
            {errors.address ? <p className="mt-1.5 text-xs text-danger">{errors.address.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Estado</label>
            <Select {...register('isActive')}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Notas</label>
            <Input {...register('notes')} placeholder="Observaciones relevantes" />
          </div>
        </div>
      </FormSection>

      <button type="submit" className="hidden" aria-hidden="true" disabled={isSubmitting}>Submit</button>
    </form>
  )
}
