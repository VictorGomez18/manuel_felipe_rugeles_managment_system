import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface FormSectionProps {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}

export const FormSection = ({ icon, title, description, children }: FormSectionProps) => {
  return (
    <section className="space-y-4 border-b border-neutral-200/80 pb-6 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-lighter text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-[-0.02em] text-neutral-900">{title}</h3>
          {description ? <p className={cn('mt-1 text-sm leading-6 text-neutral-500')}>{description}</p> : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
