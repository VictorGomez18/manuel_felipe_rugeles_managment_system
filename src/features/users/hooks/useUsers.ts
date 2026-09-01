import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { supabase } from '../../../lib/supabase'
import type { AppRole } from '../../auth/permissions'
import type { AppUserRecord } from '../types'

const usersKeys = {
  all: ['users'] as const,
  list: (search: string, role: string, status: string) => [...usersKeys.all, search, role, status] as const,
}

type UserRow = {
  id: string
  full_name: string
  role: AppRole
  phone?: string | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface CreateUserValues {
  fullName: string
  email: string
  password: string
  role: AppRole
  phone?: string
}

const mapUser = (row: UserRow): AppUserRecord => ({
  id: row.id,
  fullName: row.full_name,
  role: row.role,
  phone: row.phone,
  isActive: row.is_active,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
})

const fetchUsers = async (search: string, role: string, status: string) => {
  if (!supabase) return [] as AppUserRecord[]
  let query = supabase.from('profiles').select('id, full_name, role, phone, is_active, created_at, updated_at').order('full_name')
  if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  if (role !== 'all') query = query.eq('role', role)
  if (status !== 'all') query = query.eq('is_active', status === 'active')
  const { data, error } = await query
  if (error) throw new Error('No se pudieron cargar los usuarios del sistema.')
  return ((data ?? []) as UserRow[]).map(mapUser)
}

const updateUser = async ({ id, values }: { id: string; values: Omit<AppUserRecord, 'id' | 'createdAt' | 'updatedAt'> }) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { error } = await supabase.from('profiles').update({ full_name: values.fullName.trim(), role: values.role, phone: values.phone?.trim() || null, is_active: values.isActive }).eq('id', id)
  if (error) throw new Error('No se pudo actualizar el usuario.')
}

const createUser = async (values: CreateUserValues) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { data: sessionData } = await supabase.auth.getSession()
  const { data, error } = await supabase.auth.signUp({ email: values.email.trim().toLowerCase(), password: values.password, options: { data: { full_name: values.fullName.trim() } } })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('No se pudo crear la cuenta.')

  if (data.session && sessionData.session) {
    await supabase.auth.setSession({ access_token: sessionData.session.access_token, refresh_token: sessionData.session.refresh_token })
  }

  const { error: profileError } = await supabase.from('profiles').upsert({ id: data.user.id, full_name: values.fullName.trim(), role: values.role, phone: values.phone?.trim() || null, is_active: true })
  if (profileError) throw new Error('La cuenta fue creada, pero no se pudo completar su configuracion de acceso. Contacta a la administracion del sistema.')
}

export const useUsers = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const debouncedSearch = useDebouncedValue(search)
  const usersQuery = useQuery({ queryKey: usersKeys.list(debouncedSearch, role, status), queryFn: () => fetchUsers(debouncedSearch, role, status) })
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: usersKeys.all }) }
  const updateMutation = useMutation({ mutationFn: updateUser, onSuccess: refresh })
  const createMutation = useMutation({ mutationFn: createUser, onSuccess: refresh })
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const summary = useMemo(() => ({ total: users.length, active: users.filter((user) => user.isActive).length, admins: users.filter((user) => user.role === 'admin' || user.role === 'director').length, teachers: users.filter((user) => user.role === 'teacher').length }), [users])
  return { users, search, setSearch, role, setRole, status, setStatus, summary, isLoading: usersQuery.isLoading, error: usersQuery.error instanceof Error ? usersQuery.error.message : null, saveUser: updateMutation.mutateAsync, isSaving: updateMutation.isPending, createUser: createMutation.mutateAsync, isCreating: createMutation.isPending }
}


