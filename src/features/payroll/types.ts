export interface PayrollPeriodRecord {
  id: string
  employeeId: string
  employeeName: string
  periodStart: string
  periodEnd: string
  baseSalary: number
  bonus: number
  deductions: number
  totalAmount: number
  currency: 'USD' | 'VES'
  dueDate?: string | null
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  paidAmount: number
}


