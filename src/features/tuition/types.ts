export interface TuitionRecord {
  id: string
  studentId: string
  studentName: string
  guardianName: string
  classroomName?: string | null
  periodId: string
  periodLabel: string
  amount: number
  amountPaid: number
  balance: number
  dueDate: string
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
}

export interface TuitionFilters {
  year: number
  month: number
  classroom: string
  status: string
}
