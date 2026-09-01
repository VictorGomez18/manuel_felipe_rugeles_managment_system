import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { supabaseConfigError } from '../../../lib/supabase'
import { useAuth } from '../auth-context'

const loginSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginForm = () => {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, isLoading: isAuthLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    if (supabaseConfigError) {
      setError(supabaseConfigError)
      return
    }

    setError(null)

    try {
      await signIn({
        email: data.email,
        password: data.password,
      })
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Error de conexion. Intente mas tarde.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {supabaseConfigError ? (
        <div className="rounded-2xl border border-warning/25 bg-warning-lighter px-4 py-3 text-sm text-warning">
          {supabaseConfigError}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger-lighter px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Correo electronico
        </label>
        <div
          className={`group flex items-center gap-3 rounded-2xl border bg-white px-4 transition-all ${
            errors.email
              ? 'border-danger/50 ring-2 ring-danger/10'
              : 'border-neutral-200 focus-within:border-primary/45 focus-within:ring-4 focus-within:ring-primary/8'
          }`}
        >
          <Mail className={`h-4 w-4 ${errors.email ? 'text-danger' : 'text-neutral-400 group-focus-within:text-primary'}`} />
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="h-13 w-full border-0 bg-transparent py-3.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            placeholder="Correo institucional"
          />
        </div>
        {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
          Contrasena
        </label>
        <div
          className={`group flex items-center gap-3 rounded-2xl border bg-white px-4 transition-all ${
            errors.password
              ? 'border-danger/50 ring-2 ring-danger/10'
              : 'border-neutral-200 focus-within:border-primary/45 focus-within:ring-4 focus-within:ring-primary/8'
          }`}
        >
          <LockKeyhole className={`h-4 w-4 ${errors.password ? 'text-danger' : 'text-neutral-400 group-focus-within:text-primary'}`} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password')}
            className="h-13 w-full border-0 bg-transparent py-3.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            placeholder="Contrasena"
          />
          <button
            type="button"
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? <p className="mt-1 text-xs text-danger">{errors.password.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isAuthLoading || Boolean(supabaseConfigError)}
        className="focus-ring mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl border border-transparent bg-primary px-4 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(17,17,132,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary-dark disabled:translate-y-0 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Iniciando sesion...
          </>
        ) : (
          'Iniciar sesion'
        )}
      </button>
    </form>
  )
}
