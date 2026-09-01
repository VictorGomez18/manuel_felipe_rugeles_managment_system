export interface GuardianStudentSummary {
  id: string
  fullName: string
  status: 'active' | 'withdrawn' | 'graduated'
  classroom?: string | null
}

export interface Guardian {
  id: string
  fullName: string
  documentType?: string | null
  documentNumber?: string | null
  document: string
  phone: string
  email: string
  address: string
  notes?: string | null
  isActive: boolean
  students: GuardianStudentSummary[]
  debtTotal: number
  pendingObligations: number
  recentPayments: number
}

export interface GuardianFormValues {
  fullName: string
  document: string
  phone: string
  email: string
  address: string
  notes?: string
  isActive: boolean
}
