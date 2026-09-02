export interface ExpenseRecord {
  id: string
  expenseDate: string
  categoryId?: string | null
  categoryName: string
  description: string
  amount: number
  currency: 'USD' | 'VES'
  paymentMethod: string
  referenceNumber?: string | null
  status: 'active' | 'voided'
  registeredBy?: string | null
  notes?: string | null
}

export interface ExpenseCategoryRecord {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}


