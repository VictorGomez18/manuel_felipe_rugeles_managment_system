import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, type = 'button', ...props }, ref) => {
    const baseStyles = 'focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:pointer-events-none'

    const variants = {
      primary: 'bg-primary text-white shadow-sm hover:bg-primary-dark active:bg-primary-dark/95',
      secondary: 'border border-neutral-200 bg-white text-neutral-800 shadow-xs hover:border-neutral-300 hover:bg-neutral-50',
      ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
      danger: 'bg-danger text-white shadow-sm hover:bg-danger-dark',
      'outline-danger': 'border border-danger/25 bg-white text-danger hover:bg-danger-lighter hover:border-danger/40',
    }

    const sizes = {
      sm: 'min-h-9 px-3.5 text-sm',
      md: 'min-h-11 px-4 text-sm',
      lg: 'min-h-12 px-5 text-[15px]',
    }

    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variants[variant], sizes[size], disabled || isLoading ? 'opacity-70' : '', className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {!isLoading && leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
        <span>{children}</span>
        {!isLoading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </button>
    )
  }
)

Button.displayName = 'Button'
