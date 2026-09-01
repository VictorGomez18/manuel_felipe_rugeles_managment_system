import { useEffect, useState, type ReactNode } from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigError } from '../../lib/supabase'
import { AuthContext } from './auth-context'
import type { AuthContextValue, AuthCredentials, UserProfile } from './auth.types'
import { hasPermission } from './permissions'

const mapAuthError = () => 'No se pudo iniciar sesion. Verifica tus credenciales e intenta nuevamente.'

const mapProfile = (record: {
  id: string
  full_name: string
  role: UserProfile['role']
  phone?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}): UserProfile => ({
  id: record.id,
  fullName: record.full_name,
  role: record.role,
  phone: record.phone,
  isActive: record.is_active,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const loadProfile = async (client: NonNullable<typeof supabase>, user: User) => {
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, role, phone, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (error) {
    throw new Error('No se pudo cargar el perfil del usuario.')
  }

  return mapProfile(data)
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))

  useEffect(() => {
    const client = supabase

    if (!client) {
      return
    }

    let isMounted = true

    const handleSession = async (session: Session | null, event?: AuthChangeEvent) => {
      const nextUser = session?.user ?? null
      if (!isMounted) return

      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const nextProfile = await loadProfile(client, nextUser)

        if (!isMounted) return

        if (!nextProfile.isActive) {
          await client.auth.signOut()
          setUser(null)
          setProfile(null)
        } else {
          setProfile(nextProfile)
        }
      } catch {
        if (!isMounted) return
        setProfile(null)

        if (event !== 'SIGNED_OUT') {
          await client.auth.signOut()
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void client.auth.getSession().then(({ data }) => handleSession(data.session))

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      void handleSession(session, event)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async ({ email, password }: AuthCredentials) => {
    const client = supabase

    if (!client) {
      throw new Error(supabaseConfigError ?? 'Supabase no esta configurado.')
    }

    const { error } = await client.auth.signInWithPassword({ email, password })

    if (error) {
      throw new Error(mapAuthError())
    }
  }

  const signOut = async () => {
    const client = supabase

    if (!client) return

    const { error } = await client.auth.signOut()
    if (error) {
      throw new Error('No se pudo cerrar sesion.')
    }
  }

  const value: AuthContextValue = {
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    isAuthenticated: Boolean(user && profile?.isActive),
    signIn,
    signOut,
    can: (permission) => hasPermission(profile?.role, permission),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
