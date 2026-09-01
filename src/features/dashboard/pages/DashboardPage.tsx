import { AlertTriangle, ArrowRight, CalendarClock, CircleDollarSign, GraduationCap, WalletCards } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../../../components/ui/Card'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useDashboardData } from '../hooks/useDashboardData'

const chartLegend = [
  { label: 'Ingresos', color: '#111184' },
  { label: 'Gastos', color: '#A3A3C7' },
]

export const DashboardPage = () => {
  const { data, isLoading, error } = useDashboardData()

  if (isLoading || !data) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <PageHeader
          eyebrow="Centro de Educacion Inicial"
          title="Resumen del dia"
          description="Vista general del estado administrativo y financiero del Manuel Felipe Rugeles para el 29 de agosto de 2026."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
        <Skeleton className="h-[340px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <PageHeader
          eyebrow="Centro de Educacion Inicial"
          title="Resumen del dia"
          description="Vista general del estado administrativo y financiero del Manuel Felipe Rugeles para el 29 de agosto de 2026."
        />
        <Card>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">No se pudo cargar el dashboard</h2>
            <p className="text-sm text-neutral-500">{error instanceof Error ? error.message : 'Ocurrio un error inesperado.'}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Centro de Educacion Inicial"
        title="Resumen del dia"
        description="Vista general del estado administrativo y financiero del Manuel Felipe Rugeles para el 29 de agosto de 2026."
      />

      {data.isUsingMockData ? (
        <Card>
          <p className="text-sm text-neutral-600">No fue posible sincronizar la informacion en este momento. Los indicadores mostrados pueden estar desactualizados.</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => {
          const icon = stat.icon === 'GraduationCap'
            ? <GraduationCap className="h-5 w-5" />
            : stat.icon === 'WalletCards'
              ? <WalletCards className="h-5 w-5" />
              : stat.icon === 'CircleDollarSign'
                ? <CircleDollarSign className="h-5 w-5" />
                : <CalendarClock className="h-5 w-5" />

          const subtitle = stat.trend
            ? `${stat.trendDirection === 'up' ? '↑' : '↓'} ${stat.trend}`
            : stat.progress !== undefined
              ? `${stat.progress}% del objetivo mensual`
              : undefined

          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              subtitle={subtitle}
              icon={icon}
              tone={stat.icon === 'WalletCards' ? 'highlight' : stat.icon === 'CircleDollarSign' ? 'warning' : stat.progress !== undefined ? 'progress' : 'default'}
              progress={stat.progress}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <Card>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">Ingresos vs gastos</h3>
              <p className="mt-1 text-sm text-neutral-500">Comparativo semestral con lectura rapida y menos ruido visual.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {chartLegend.map((item) => (
                <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-25 px-3 py-1.5 text-xs font-medium text-neutral-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          <div className="h-[300px] sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cashflowData} barGap={10} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="4 6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} width={52} />
                <Tooltip
                  cursor={{ fill: 'rgba(17, 17, 132, 0.03)' }}
                  contentStyle={{ borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 12px 32px rgba(15,23,42,0.08)' }}
                  formatter={(value, name) => [`$${String(value ?? '')}`, name === 'ingresos' ? 'Ingresos' : 'Gastos']}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Bar dataKey="ingresos" fill="#111184" radius={[8, 8, 0, 0]} maxBarSize={34} />
                <Bar dataKey="gastos" fill="#A3A3C7" radius={[8, 8, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">Cobranza del mes</h3>
              <p className="mt-1 text-sm text-neutral-500">Balance entre lo cobrado y lo pendiente.</p>
            </div>
            <StatusBadge status={data.collection.pendingCount > 0 ? 'warning' : 'active'} label={`${data.collection.pendingCount} pendientes`} />
          </div>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#111184" strokeWidth="10" strokeDasharray="238.64" strokeDashoffset={238.64 - (238.64 * data.collection.percentage) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[2rem] font-semibold tracking-[-0.05em] text-neutral-900">{data.collection.percentage}%</span>
                <span className="text-sm text-neutral-500">cobrado</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm text-neutral-500">Cobrado hasta la fecha</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-neutral-900">${data.collection.collected.toFixed(2)} <span className="text-base font-medium text-neutral-400">de ${data.collection.expected.toFixed(2)}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-25 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Mensualidades pendientes</p>
                  <p className="mt-2 text-lg font-semibold text-neutral-900">{data.collection.pendingCount}</p>
                </div>
                <div className="rounded-2xl bg-primary-lighter/40 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/60">Progreso</p>
                  <p className="mt-2 text-lg font-semibold text-neutral-900">{data.collection.trend}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">Pagos recientes</h3>
              <p className="mt-1 text-sm text-neutral-500">Movimientos procesados mas recientemente.</p>
            </div>
            <button type="button" className="focus-ring inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-150 hover:text-primary-dark">
              Ver todos <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-neutral-100">
            {data.recentPayments.map((payment) => (
              <div key={payment.receipt} className="flex items-start justify-between gap-4 py-4 first:pt-1 last:pb-1">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-lighter text-sm font-semibold text-primary">
                    {payment.student.split(' ').map((part) => part.charAt(0)).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-neutral-900">{payment.student}</p>
                    <p className="mt-1 truncate text-sm text-neutral-500">{payment.receipt} · {payment.method}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[15px] font-semibold tabular-nums text-neutral-900">{payment.amount}</p>
                  <p className="mt-1 text-sm text-neutral-500">{payment.date}</p>
                </div>
              </div>
            ))}
            {data.recentPayments.length === 0 ? <p className="py-6 text-sm text-neutral-500">No hay pagos recientes visibles para tu rol.</p> : null}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">Alertas administrativas</h3>
              <p className="mt-1 text-sm text-neutral-500">Acciones recomendadas para hoy.</p>
            </div>
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <button key={alert.message} type="button" className="focus-ring flex w-full items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-25 px-4 py-3.5 text-left transition-colors duration-150 hover:border-primary/15 hover:bg-primary-lighter/30">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${alert.type === 'warning' ? 'bg-accent-light text-accent-dark' : 'bg-primary-lighter text-primary'}`}>
                      {alert.type === 'warning' ? <AlertTriangle className="h-4.5 w-4.5" /> : <CalendarClock className="h-4.5 w-4.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{alert.message}</p>
                      <p className="mt-1 text-sm text-neutral-500">{alert.detail}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">Ver <ArrowRight className="h-4 w-4" /></span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">Mensualidades vencidas</h3>
              <p className="mt-1 text-sm text-neutral-500">Casos que requieren seguimiento prioritario.</p>
            </div>
            <div className="space-y-3">
              {data.overdueList.map((item) => (
                <div key={`${item.student}-${item.days}`} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.student}</p>
                    <p className="mt-1 text-sm text-neutral-500">Saldo pendiente activo</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status="overdue" label={`${item.days} dias`} />
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-neutral-900">{item.amount}</p>
                      <p className="mt-1 text-xs text-neutral-400">por cobrar</p>
                    </div>
                  </div>
                </div>
              ))}
              {data.overdueList.length === 0 ? <p className="text-sm text-neutral-500">No hay mensualidades vencidas activas.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

