import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { supabase } from '../../../lib/supabase'

const PAGE_SIZE = 15

const auditKeys = {
  all: ['audit-logs'] as const,
  list: (search: string, page: number) => [...auditKeys.all, search, page] as const,
}

export interface AuditLogRecord {
  id: string
  createdAt: string
  action: string
  entity: string
  entityId: string
  notes?: string | null
  userName: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}

const fetchAuditLogs = async (search: string, page: number) => {
  if (!supabase) {
    return { data: [] as AuditLogRecord[], count: 0 }
  }

  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      created_at,
      action,
      entity,
      entity_id,
      old_values,
      new_values,
      notes,
      profiles (
        full_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (search) {
    query = query.or([
      `action.ilike.%${search}%`,
      `entity.ilike.%${search}%`,
      `notes.ilike.%${search}%`,
    ].join(','))
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error('No se pudo cargar la auditoria.')
  }

  return {
    data: (data ?? []).map((row: {
      id: string
      created_at: string
      action: string
      entity: string
      entity_id: string
      old_values?: Record<string, unknown> | null
      new_values?: Record<string, unknown> | null
      notes?: string | null
      profiles?: { full_name: string } | { full_name: string }[] | null
    }) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

      return {
        id: row.id,
        createdAt: row.created_at,
        action: row.action,
        entity: row.entity,
        entityId: row.entity_id,
        notes: row.notes,
        oldValues: row.old_values,
        newValues: row.new_values,
        userName: profile?.full_name ?? 'Usuario no disponible',
      }
    }),
    count: count ?? 0,
  }
}

export const useAuditLogs = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)
  const query = useQuery({ queryKey: auditKeys.list(debouncedSearch, page), queryFn: () => fetchAuditLogs(debouncedSearch, page) })

  return {
    logs: query.data?.data ?? [],
    total: query.data?.count ?? 0,
    totalPages: Math.max(1, Math.ceil((query.data?.count ?? 0) / PAGE_SIZE)),
    search,
    setSearch,
    page,
    setPage,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  }
}


