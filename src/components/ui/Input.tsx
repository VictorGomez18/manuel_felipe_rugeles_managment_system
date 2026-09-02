import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error = false, leftIcon, rightIcon, disabled, onKeyDown, ...props }, ref) => {
  return (
    <div className="relative">
      {leftIcon ? <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">{leftIcon}</span> : null}
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={error}
        className={cn(
          'focus-ring h-11 w-full rounded-xl border bg-white px-3.5 text-[15px] text-neutral-900 shadow-xs outline-none transition-all duration-150 placeholder:text-neutral-400 hover:border-neutral-300',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          error ? 'border-danger/60 bg-danger-lighter/40 text-danger-dark placeholder:text-danger/50' : 'border-neutral-200',
          disabled && 'bg-neutral-50 text-neutral-400 hover:border-neutral-200',
          className,
        )}
        onKeyDown={(event) => {
          if (props.type === 'number' && ['e', 'E', '+', '-'].includes(event.key)) event.preventDefault()
          onKeyDown?.(event)
        }}
        {...props}
      />
      {rightIcon ? <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400">{rightIcon}</span> : null}
    </div>
  )
})

Input.displayName = 'Input'



