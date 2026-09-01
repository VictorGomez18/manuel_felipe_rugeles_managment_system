import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpenText, School } from 'lucide-react'
import { FormSection } from '../../../components/ui/FormSection'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import type { ClassroomFormValues, LevelFormValues, LevelRecord, TeacherOption } from '../types'

const levelSchema = z.object({
  name: z.string().min(2, 'El nombre del nivel es obligatorio'),
  description: z.string().optional(),
  isActive: z.enum(['true', 'false']),
})

type LevelSchemaValues = z.infer<typeof levelSchema>

export const LevelForm = ({ onSubmit, initialValues, formId = 'level-form' }: {
  onSubmit: (values: LevelFormValues) => Promise<void> | void
  initialValues?: LevelFormValues
  formId?: string
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LevelSchemaValues>({
    resolver: zodResolver(levelSchema),
    defaultValues: initialValues ? { ...initialValues, isActive: initialValues.isActive ? 'true' : 'false' } : { isActive: 'true' },
  })

  return (
    <form id={formId} onSubmit={handleSubmit(async (values) => {
      await onSubmit({
        name: values.name,
        description: values.description,
        isActive: values.isActive === 'true',
      })
    })} className="space-y-6">
      <FormSection icon={<BookOpenText className="h-5 w-5" />} title="Nivel educativo" description="Configuracion administrativa de los niveles disponibles en el centro.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nombre</label>
            <Input {...register('name')} error={!!errors.name} placeholder="Preescolar" />
            {errors.name ? <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Estado</label>
            <Select {...register('isActive')}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Descripcion</label>
            <Input {...register('description')} placeholder="Descripcion del nivel" />
          </div>
        </div>
      </FormSection>
      <button type="submit" className="hidden" aria-hidden="true" disabled={isSubmitting}>Submit</button>
    </form>
  )
}

const classroomSchema = z.object({
  name: z.string().min(2, 'El nombre del salon es obligatorio'),
  levelId: z.string().optional(),
  turn: z.string().min(1, 'Selecciona un turno'),
  teacherId: z.string().optional(),
  isActive: z.enum(['true', 'false']),
})

type ClassroomSchemaValues = z.infer<typeof classroomSchema>

export const ClassroomForm = ({ onSubmit, levels, teachers, initialValues, formId = 'classroom-form' }: {
  onSubmit: (values: ClassroomFormValues) => Promise<void> | void
  levels: LevelRecord[]
  teachers: TeacherOption[]
  initialValues?: ClassroomFormValues
  formId?: string
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClassroomSchemaValues>({
    resolver: zodResolver(classroomSchema),
    defaultValues: initialValues ? { ...initialValues, isActive: initialValues.isActive ? 'true' : 'false' } : { turn: 'morning', isActive: 'true' },
  })

  return (
    <form id={formId} onSubmit={handleSubmit(async (values) => {
      await onSubmit({
        name: values.name,
        levelId: values.levelId || undefined,
        turn: values.turn,
        teacherId: values.teacherId || undefined,
        isActive: values.isActive === 'true',
      })
    })} className="space-y-6">
      <FormSection icon={<School className="h-5 w-5" />} title="Salon" description="Datos de estructura academica y asignacion basica del salon.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nombre</label>
            <Input {...register('name')} error={!!errors.name} placeholder="Sala 4" />
            {errors.name ? <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Turno</label>
            <Select {...register('turn')} error={!!errors.turn}>
              <option value="morning">Manana</option>
              <option value="afternoon">Tarde</option>
              <option value="both">Ambos</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nivel</label>
            <Select {...register('levelId')}>
              <option value="">Sin nivel</option>
              {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Docente</label>
            <Select {...register('teacherId')}>
              <option value="">Sin docente</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Estado</label>
            <Select {...register('isActive')}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>
        </div>
      </FormSection>
      <button type="submit" className="hidden" aria-hidden="true" disabled={isSubmitting}>Submit</button>
    </form>
  )
}

