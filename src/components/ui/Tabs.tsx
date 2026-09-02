import { cn } from '../../lib/utils'

interface TabsProps {
  tabs: { label: string; value: string; count?: number }[]
  active: string
  onChange: (value: string) => void
}

export const Tabs = ({ tabs, active, onChange }: TabsProps) => {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="inline-flex min-w-full gap-2 rounded-2xl border border-neutral-200 bg-white p-1 shadow-xs">
        {tabs.map((tab) => {
          const isActive = active === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                'focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-all duration-150',
                isActive ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' ? <span className={cn('rounded-full px-2 py-0.5 text-xs', isActive ? 'bg-white/18 text-white' : 'bg-neutral-100 text-neutral-500')}>{tab.count}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}


