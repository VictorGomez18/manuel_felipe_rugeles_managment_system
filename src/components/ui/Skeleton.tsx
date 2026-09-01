import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'table-row'
}

export const Skeleton = ({ className, variant = 'text' }: SkeletonProps) => {
  if (variant === 'card') return <div className={cn('animate-pulse bg-neutral-200 rounded-lg h-32', className)} />
  if (variant === 'table-row') return <div className={cn('animate-pulse bg-neutral-200 rounded h-8', className)} />
  return <div className={cn('animate-pulse bg-neutral-200 rounded h-4', className)} />
}

