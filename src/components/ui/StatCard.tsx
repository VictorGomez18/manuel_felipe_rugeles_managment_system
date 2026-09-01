import type { ReactNode } from 'react'
import { Card } from './Card'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  icon: ReactNode
  tone?: 'default' | 'highlight' | 'warning' | 'progress'
  progress?: number
}

export const StatCard = ({ label, value, subtitle, icon, tone = 'default', progress }: StatCardProps) => {
  const toneStyles = {
    default: 'border-neutral-200/80 bg-white',
    highlight: 'border-primary/15 bg-primary-lighter/40',
    warning: 'border-accent/15 bg-accent-lighter/50',
    progress: 'border-neutral-200/80 bg-white',
  }

  const iconStyles = {
    default: 'bg-primary-lighter text-primary',
    highlight: 'bg-white text-primary shadow-xs',
    warning: 'bg-white text-accent-dark shadow-xs',
    progress: 'bg-primary-lighter text-primary',
  }

  return (
    <Card className={cn('relative overflow-hidden', toneStyles[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="kpi-value mt-3">{value}</p>
          {subtitle ? <p className="mt-2 text-sm leading-6 text-neutral-600">{subtitle}</p> : null}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', iconStyles[tone])}>{icon}</div>
      </div>
      {typeof progress === 'number' ? (
        <div className="mt-5">
          <div className="h-2 w-full rounded-full bg-neutral-100">
            <div className="h-2 rounded-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
    </Card>
  )
}
