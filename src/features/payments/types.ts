export interface PaymentRecord {
  id: string
  receiptNumber: string
  studentId: string
  studentName: string
  guardianId: string
  guardianName: string
  conceptId?: string | null
  conceptName: string
  amount: number
  currency: 'USD' | 'VES'
  paymentMethod: string
  referenceNumber?: string | null
  paymentDate: string
  status: 'active' | 'voided'
  registeredBy?: string | null
  notes?: string | null
}

export interface PaymentFormValues {
  studentId: string
  guardianId: string
  conceptId?: string
  amount: number
  currency: 'USD' | 'VES'
  paymentMethod: string
  referenceNumber?: string
  paymentDate: string
  notes?: string
}


