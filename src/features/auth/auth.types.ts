import type { User } from '@supabase/supabase-js'
import type { AppPermission, AppRole } from './permissions'

export interface UserProfile {
  id: string
  fullName: string
  role: AppRole
  phone?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  role: AppRole | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (credentials: AuthCredentials) => Promise<void>
  signOut: () => Promise<void>
  can: (permission: AppPermission) => boolean
}
