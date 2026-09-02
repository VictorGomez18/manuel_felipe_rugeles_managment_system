import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error = false, disabled, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={error}
        className={cn(
          'focus-ring h-11 w-full appearance-none rounded-xl border bg-white px-3.5 pr-10 text-[15px] text-neutral-900 shadow-xs outline-none transition-all duration-150 hover:border-neutral-300',
          error ? 'border-danger/60 bg-danger-lighter/40 text-danger-dark' : 'border-neutral-200',
          disabled && 'bg-neutral-50 text-neutral-400 hover:border-neutral-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
    </div>
  )
})

Select.displayName = 'Select'


