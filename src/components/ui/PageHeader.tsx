import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-neutral-200/80 bg-white px-5 py-5 shadow-xs sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">{eyebrow}</p> : null}
        <h1 className="text-balance text-2xl font-semibold tracking-[-0.04em] text-neutral-900 sm:text-[2rem]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500 sm:text-[15px]">{description}</p> : null}
      </div>
      {actions ? <div className={cn('flex shrink-0 flex-wrap items-center gap-3')}>{actions}</div> : null}
    </div>
  )
}


