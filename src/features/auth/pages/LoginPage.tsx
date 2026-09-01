import { LoginForm } from '../components/LoginForm'
import logo from '../../../assets/logo.jpeg'

export const LoginPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef3ff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-primary/16 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-accent/16 blur-3xl" />
        <div className="subtle-grid absolute inset-0 opacity-70" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_32px_90px_rgba(17,17,132,0.12)] backdrop-blur xl:grid-cols-[1fr_0.9fr]">
          <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-[#1f2da8] px-10 py-10 text-white xl:flex xl:flex-col xl:justify-between">
            <div className="absolute right-[-6rem] top-[-5rem] h-56 w-56 rounded-full border border-white/15 bg-white/10" />
            <div className="absolute bottom-[-7rem] left-[-4rem] h-64 w-64 rounded-full border border-white/10 bg-white/5" />

            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-white/12 p-3 ring-1 ring-white/15">
                  <img src={logo} alt="Logo CEI Manuel Felipe Rugeles" className="h-16 w-16 rounded-2xl object-cover" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">CEI Manuel Felipe Rugeles</p>
                  <h1 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-[-0.05em] text-balance">
                    Sistema administrativo y financiero.
                  </h1>
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl border border-white/12 bg-white/10 px-6 py-5 text-sm text-white/78 backdrop-blur-sm">
              <p className="font-medium text-white">Centro de Educacion Inicial Manuel Felipe Rugeles</p>
              <p className="mt-1 text-white/68">Panel interno institucional</p>
            </div>
          </section>

          <section className="relative flex items-center px-5 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 xl:hidden">
                <div className="inline-flex rounded-3xl bg-primary/8 p-3 ring-1 ring-primary/10">
                  <img src={logo} alt="Logo CEI Manuel Felipe Rugeles" className="h-14 w-14 rounded-2xl object-cover" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.28em] text-primary/70">CEI Manuel Felipe Rugeles</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-900">
                  Iniciar sesion
                </h1>
              </div>

              <div className="hidden xl:block">
                <h2 className="text-4xl font-semibold tracking-[-0.05em] text-neutral-900">
                  Inicia sesion
                </h2>
              </div>

              <div className="app-panel mt-8 rounded-[28px] border-white/70 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
                <LoginForm />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
