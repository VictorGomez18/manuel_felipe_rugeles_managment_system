import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { useAuth } from './auth-context'

const AuthLoadingState = ({ message }: { message: string }) => (
  <div className="mx-auto flex min-h-screen w-full max-w-content items-center justify-center px-4 py-8">
    <Card className="w-full max-w-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-neutral-900">Cargando sesión</h1>
        <p className="text-sm text-neutral-500">{message}</p>
      </div>
    </Card>
  </div>
)

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingState message="Estamos validando tus permisos y restaurando la sesión actual." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export const GuestRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <AuthLoadingState message="Estamos verificando si ya existe una sesión activa." />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}




