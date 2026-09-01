import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { FormSection } from '../../../components/ui/FormSection'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Select } from '../../../components/ui/Select'
import { Input } from '../../../components/ui/Input'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Toast } from '../../../components/ui/Toast'
import { useSettings } from '../hooks/useSettings'
import { useEffect, useState } from 'react'

const settingsSchema = z.object({
  schoolName: z.string().min(3, 'El nombre institucional es obligatorio'),
  mainCurrency: z.enum(['USD', 'VES']),
  monthlyFeeDueDay: z.coerce.number().int().min(1).max(31),
  exchangeRateUsdVes: z.union([z.coerce.number().positive(), z.literal('')]).transform((value) => value === '' ? null : value),
})

type SettingsFormValues = z.input<typeof settingsSchema>

export const SettingsPage = () => {
  const { settings, isLoading, error, saveSettings, isSaving } = useSettings()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      schoolName: '',
      mainCurrency: 'USD',
      monthlyFeeDueDay: 5,
      exchangeRateUsdVes: '',
    },
  })

  useEffect(() => {
    if (!settings) return
    reset({
      schoolName: settings.schoolName,
      mainCurrency: settings.mainCurrency,
      monthlyFeeDueDay: settings.monthlyFeeDueDay,
      exchangeRateUsdVes: settings.exchangeRateUsdVes ?? '',
    })
  }, [reset, settings])

  if (isLoading || !settings) {
    return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-72 w-full" /></div>
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader eyebrow="Sistema" title="Configuracion" description="Parametros generales del centro y referencias operativas del sistema." />
      {error ? <Card><p className="text-sm text-neutral-500">{error}</p></Card> : null}
      <Card>
        <form onSubmit={handleSubmit(async (values) => {
          try {
            const parsed = settingsSchema.parse(values)
            await saveSettings({
              schoolName: parsed.schoolName,
              mainCurrency: parsed.mainCurrency,
              monthlyFeeDueDay: parsed.monthlyFeeDueDay,
              exchangeRateUsdVes: parsed.exchangeRateUsdVes,
            })
            setToast({ type: 'success', message: 'Configuracion actualizada correctamente.' })
          } catch (formError) {
            setToast({ type: 'error', message: formError instanceof Error ? formError.message : 'No se pudo guardar la configuracion.' })
          } finally {
            window.setTimeout(() => setToast(null), 2200)
          }
        })} className="space-y-6">
          <FormSection icon={<Settings className="h-5 w-5" />} title="Parametros del sistema" description="Configuracion base usada por el modulo administrativo y financiero.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nombre institucional</label>
                <Input {...register('schoolName')} error={!!errors.schoolName} />
                {errors.schoolName ? <p className="mt-1.5 text-xs text-danger">{errors.schoolName.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Moneda principal</label>
                <Select {...register('mainCurrency')}>
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Dia de vencimiento mensual</label>
                <Input type="number" min={1} max={31} {...register('monthlyFeeDueDay')} error={!!errors.monthlyFeeDueDay} />
                {errors.monthlyFeeDueDay ? <p className="mt-1.5 text-xs text-danger">{errors.monthlyFeeDueDay.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Tasa USD/VES</label>
                <Input type="number" step="0.01" {...register('exchangeRateUsdVes')} error={!!errors.exchangeRateUsdVes} placeholder="Opcional" />
                {errors.exchangeRateUsdVes ? <p className="mt-1.5 text-xs text-danger">{errors.exchangeRateUsdVes.message as string}</p> : null}
              </div>
            </div>
          </FormSection>
          <div className="flex justify-end"><Button type="submit" isLoading={isSaving}>Guardar configuracion</Button></div>
        </form>
      </Card>
      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}
