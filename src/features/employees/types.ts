export interface EmployeeRecord {
  id: string
  fullName: string
  document: string
  phone: string
  role: string
  hireDate?: string | null
  baseSalary: number
  currency: 'USD' | 'VES'
  payrollFrequency: string
  status: 'active' | 'inactive'
  notes?: string | null
}


