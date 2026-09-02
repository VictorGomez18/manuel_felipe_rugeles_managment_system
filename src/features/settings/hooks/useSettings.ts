import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

export interface AppSettings {
  schoolName: string
  mainCurrency: 'USD' | 'VES'
  monthlyFeeDueDay: number
  exchangeRateUsdVes: number | null
}

const settingsKeys = {
  all: ['settings'] as const,
}

type SettingRow = {
  key: string
  value: unknown
}

const parseSettingValue = <T,>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback
  return value as T
}

const fetchSettings = async (): Promise<AppSettings> => {
  if (!supabase) {
    return {
      schoolName: 'Centro de Educacion Inicial Manuel Felipe Rugeles',
      mainCurrency: 'USD',
      monthlyFeeDueDay: 5,
      exchangeRateUsdVes: null,
    }
  }

  const { data, error } = await supabase.from('settings').select('key, value')

  if (error) {
    throw new Error('No se pudo cargar la configuracion.')
  }

  const rows = new Map((data ?? []).map((row: SettingRow) => [row.key, row.value]))

  return {
    schoolName: parseSettingValue(rows.get('school_name'), 'Centro de Educacion Inicial Manuel Felipe Rugeles'),
    mainCurrency: parseSettingValue(rows.get('main_currency'), 'USD'),
    monthlyFeeDueDay: Number(parseSettingValue(rows.get('monthly_fee_due_day'), 5)),
    exchangeRateUsdVes: rows.get('exchange_rate_usd_ves') === null ? null : Number(rows.get('exchange_rate_usd_ves')),
  }
}

const updateSettingRow = async (key: string, value: unknown) => {
  if (!supabase) {
    throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  }

  const { error } = await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key)

  if (error) {
    throw new Error('No se pudo guardar la configuracion.')
  }
}

const saveSettings = async (values: AppSettings) => {
  await Promise.all([
    updateSettingRow('school_name', values.schoolName),
    updateSettingRow('main_currency', values.mainCurrency),
    updateSettingRow('monthly_fee_due_day', values.monthlyFeeDueDay),
    updateSettingRow('exchange_rate_usd_ves', values.exchangeRateUsdVes),
  ])
}

export const useSettings = () => {
  const queryClient = useQueryClient()
  const settingsQuery = useQuery({ queryKey: settingsKeys.all, queryFn: fetchSettings })
  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error instanceof Error ? settingsQuery.error.message : null,
    saveSettings: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  }
}



