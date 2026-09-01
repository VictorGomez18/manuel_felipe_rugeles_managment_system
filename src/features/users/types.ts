export interface AppUserRecord {
  id: string
  fullName: string
  role: 'admin' | 'director' | 'cashier' | 'teacher'
  phone?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AppUserCreateValues {
  email: string
  password: string
  fullName: string
  role: 'admin' | 'director' | 'cashier' | 'teacher'
  phone?: string | null
  isActive: boolean
}
