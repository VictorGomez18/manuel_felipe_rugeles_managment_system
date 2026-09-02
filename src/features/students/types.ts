export interface Representative {
  id: string
  fullName: string
  documentType?: string | null
  documentNumber?: string | null
  document: string
  phone: string
  email: string
  address: string
  relationship?: string
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  fullName: string
  documentType?: string | null
  documentNumber?: string | null
  document: string
  birthDate: string
  level: string
  levelId?: string | null
  classroom: string
  classroomId?: string | null
  monthlyFee: number
  currency: 'USD' | 'VES'
  status: 'active' | 'withdrawn' | 'graduated'
  guardian: string
  guardianId?: string | null
  guardianRelationship?: string
  phone: string
  email: string
  enrollmentDate: string
  address: string
  notes?: string | null
}

export interface StudentPaymentRecord {
  id: string
  receiptNumber: string
  conceptName: string
  amount: number
  currency: 'USD' | 'VES'
  paymentMethod: string
  referenceNumber?: string | null
  paymentDate: string
  status: 'active' | 'voided'
  registeredBy?: string | null
}

export interface StudentObligationRecord {
  id: string
  periodLabel: string
  amount: number
  amountPaid: number
  balance: number
  dueDate: string
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
}

export interface StudentGuardianRecord extends Representative {
  isPrimary: boolean
}

export interface StudentHistoryRecord {
  id: string
  createdAt: string
  action: string
  entity: string
  notes?: string | null
  userName: string
}

export interface StudentDetailRecord {
  student: Student
  obligations: StudentObligationRecord[]
  payments: StudentPaymentRecord[]
  guardians: StudentGuardianRecord[]
  history: StudentHistoryRecord[]
  financialSummary: {
    pendingBalance: number
    paidThisYear: number
    nextDueDate?: string | null
  }
}

export interface LevelOption {
  id: string
  name: string
}

export interface ClassroomOption {
  id: string
  name: string
  levelId?: string | null
  levelName?: string | null
}

export interface NewGuardianInput {
  fullName: string
  document: string
  phone: string
  email: string
  address: string
  relationship?: string
}

export interface StudentFormValues {
  firstName: string
  lastName: string
  document: string
  birthDate: string
  levelId: string
  classroomId: string
  monthlyFee: number
  currency: 'USD' | 'VES'
  enrollmentDate: string
  guardianId?: string
  newGuardian?: NewGuardianInput
}


