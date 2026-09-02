import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { supabase } from '../../../lib/supabase'
import type { ExpenseCategoryRecord, ExpenseRecord } from '../types'

const PAGE_SIZE = 12
const CURRENT_MONTH_START = '2026-08-01'
const CURRENT_MONTH_END = '2026-09-01'
const PREV_MONTH_START = '2026-07-01'

const expensesKeys = {
  all: ['expenses'] as const,
  list: (page: number, filters: Record<string, string>) => [...expensesKeys.all, page, filters] as const,
  categories: () => [...expensesKeys.all, 'categories'] as const,
}

type ExpenseRow = {
  id: string
  expense_date: string
  description: string
  amount: number | string
  currency: 'USD' | 'VES'
  payment_method: string
  reference_number?: string | null
  status: 'active' | 'voided'
  notes?: string | null
  expense_categories?: { id: string; name: string } | { id: string; name: string }[] | null
  profiles?: { full_name: string } | { full_name: string }[] | null
}

type CategoryRow = {
  id: string
  name: string
  description?: string | null
  is_active: boolean
}

const mapExpense = (row: ExpenseRow): ExpenseRecord => {
  const category = Array.isArray(row.expense_categories) ? row.expense_categories[0] : row.expense_categories
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

  return {
    id: row.id,
    expenseDate: row.expense_date,
    categoryId: category?.id,
    categoryName: category?.name ?? 'Sin categoría',
    description: row.description,
    amount: Number(row.amount ?? 0),
    currency: row.currency,
    paymentMethod: row.payment_method,
    referenceNumber: row.reference_number,
    status: row.status,
    registeredBy: profile?.full_name ?? null,
    notes: row.notes,
  }
}

const fetchExpenses = async (page: number, filters: Record<string, string>) => {
  if (!supabase) return { data: [] as ExpenseRecord[], count: 0 }

  let query = supabase
    .from('expenses')
    .select(`
      id,
      expense_date,
      description,
      amount,
      currency,
      payment_method,
      reference_number,
      status,
      notes,
      expense_categories ( id, name ),
      profiles!expenses_registered_by_fkey ( full_name )
    `, { count: 'exact' })
    .order('expense_date', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (filters.startDate) query = query.gte('expense_date', filters.startDate)
  if (filters.endDate) query = query.lte('expense_date', filters.endDate)
  if (filters.category !== 'all') query = query.eq('category_id', filters.category)
  if (filters.method !== 'all') query = query.eq('payment_method', filters.method)
  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.search) query = query.ilike('description', `%${filters.search}%`)

  const { data, error, count } = await query
  if (error) throw new Error('No se pudieron cargar los gastos.')
  return { data: ((data ?? []) as ExpenseRow[]).map(mapExpense), count: count ?? 0 }
}

const fetchCategories = async () => {
  if (!supabase) return [] as ExpenseCategoryRecord[]
  const { data, error } = await supabase.from('expense_categories').select('id, name, description, is_active').order('name')
  if (error) throw new Error('No se pudieron cargar las categorías de gasto.')
  return ((data ?? []) as CategoryRow[]).map((category) => ({ id: category.id, name: category.name, description: category.description, isActive: category.is_active }))
}

const createExpense = async (values: Omit<ExpenseRecord, 'id' | 'categoryName' | 'registeredBy' | 'status'>) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { error } = await supabase.from('expenses').insert({
    expense_date: values.expenseDate,
    category_id: values.categoryId || null,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    payment_method: values.paymentMethod,
    reference_number: values.referenceNumber || null,
    notes: values.notes || null,
  })
  if (error) throw new Error('No se pudo registrar el gasto.')
}

const updateExpense = async ({ id, values }: { id: string; values: Omit<ExpenseRecord, 'id' | 'categoryName' | 'registeredBy' | 'status'> }) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { error } = await supabase.from('expenses').update({
    expense_date: values.expenseDate,
    category_id: values.categoryId || null,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    payment_method: values.paymentMethod,
    reference_number: values.referenceNumber || null,
    notes: values.notes || null,
  }).eq('id', id)
  if (error) throw new Error('No se pudo actualizar el gasto.')
}

const voidExpense = async ({ id, reason }: { id: string; reason: string }) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { error } = await supabase.rpc('void_expense', { p_expense_id: id, p_reason: reason })
  if (error) throw new Error('No se pudo anular el gasto.')
}

const createCategory = async (values: Omit<ExpenseCategoryRecord, 'id'>) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { error } = await supabase.from('expense_categories').insert({ name: values.name, description: values.description || null, is_active: values.isActive })
  if (error) throw new Error('No se pudo registrar la categoría.')
}

const updateCategory = async ({ id, values }: { id: string; values: Omit<ExpenseCategoryRecord, 'id'> }) => {
  if (!supabase) throw new Error('El servicio no esta disponible en este momento. Intenta nuevamente mas tarde.')
  const { error } = await supabase.from('expense_categories').update({ name: values.name, description: values.description || null, is_active: values.isActive }).eq('id', id)
  if (error) throw new Error('No se pudo actualizar la categoría.')
}

export const useExpenses = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ search: '', startDate: '', endDate: '', category: 'all', method: 'all', status: 'all' })
  const debouncedSearch = useDebouncedValue(filters.search)
  const mergedFilters = { ...filters, search: debouncedSearch }

  const expensesQuery = useQuery({ queryKey: expensesKeys.list(page, mergedFilters), queryFn: () => fetchExpenses(page, mergedFilters) })
  const categoriesQuery = useQuery({ queryKey: expensesKeys.categories(), queryFn: fetchCategories })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: expensesKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] }),
    ])
  }

  const createExpenseMutation = useMutation({ mutationFn: createExpense, onSuccess: invalidateAll })
  const updateExpenseMutation = useMutation({ mutationFn: updateExpense, onSuccess: invalidateAll })
  const voidExpenseMutation = useMutation({ mutationFn: voidExpense, onSuccess: invalidateAll })
  const createCategoryMutation = useMutation({ mutationFn: createCategory, onSuccess: invalidateAll })
  const updateCategoryMutation = useMutation({ mutationFn: updateCategory, onSuccess: invalidateAll })

  const expenses = useMemo(() => expensesQuery.data?.data ?? [], [expensesQuery.data])
  const summary = useMemo(() => {
    const monthExpenses = expenses.filter((item) => item.expenseDate >= CURRENT_MONTH_START && item.expenseDate < CURRENT_MONTH_END && item.status === 'active')
    const prevMonthExpenses = expenses.filter((item) => item.expenseDate >= PREV_MONTH_START && item.expenseDate < CURRENT_MONTH_START && item.status === 'active')
    const categoryTotals = new Map<string, number>()
    monthExpenses.forEach((item) => categoryTotals.set(item.categoryName, (categoryTotals.get(item.categoryName) ?? 0) + item.amount))
    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Sin categoría'
    const monthTotal = monthExpenses.reduce((sum, item) => sum + item.amount, 0)
    const prevMonthTotal = prevMonthExpenses.reduce((sum, item) => sum + item.amount, 0)
    const variation = prevMonthTotal > 0 ? Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100) : 0
    return { monthTotal, count: expensesQuery.data?.count ?? 0, topCategory, variation }
  }, [expenses, expensesQuery.data?.count])

  return {
    expenses,
    categories: categoriesQuery.data ?? [],
    filters,
    setFilters,
    page,
    setPage,
    totalPages: Math.max(1, Math.ceil((expensesQuery.data?.count ?? 0) / PAGE_SIZE)),
    summary,
    isLoading: expensesQuery.isLoading || categoriesQuery.isLoading,
    error: expensesQuery.error instanceof Error ? expensesQuery.error.message : categoriesQuery.error instanceof Error ? categoriesQuery.error.message : null,
    createExpense: createExpenseMutation.mutateAsync,
    updateExpense: updateExpenseMutation.mutateAsync,
    voidExpense: voidExpenseMutation.mutateAsync,
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    isSaving: createExpenseMutation.isPending || updateExpenseMutation.isPending || voidExpenseMutation.isPending || createCategoryMutation.isPending || updateCategoryMutation.isPending,
  }
}




