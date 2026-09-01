import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

type Status = 'paid' | 'pending' | 'partial' | 'overdue' | 'cancelled' | 'active' | 'inactive' | 'info' | 'success' | 'warning' | 'danger'

interface StatusBadgeProps {
  status: Status
  label: string
  icon?: ReactNode
}

const statusConfig: Record<Status, { className: string; icon?: ReactNode }> = {
  paid: { className: 'bg-success-light text-success-dark ring-success/15', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  pending: { className: 'bg-neutral-100 text-neutral-700 ring-neutral-200', icon: <Clock3 className="h-3.5 w-3.5" /> },
  partial: { className: 'bg-accent-light text-accent-dark ring-accent/15', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  overdue: { className: 'bg-danger-lighter text-danger-dark ring-danger/15', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  cancelled: { className: 'bg-neutral-200 text-neutral-700 ring-neutral-200', icon: <XCircle className="h-3.5 w-3.5" /> },
  active: { className: 'bg-success-lighter text-success-dark ring-success/15', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  inactive: { className: 'bg-neutral-100 text-neutral-700 ring-neutral-200', icon: <XCircle className="h-3.5 w-3.5" /> },
  info: { className: 'bg-primary-lighter text-primary-dark ring-primary/10', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  success: { className: 'bg-success-lighter text-success-dark ring-success/15', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  warning: { className: 'bg-accent-light text-accent-dark ring-accent/15', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  danger: { className: 'bg-danger-lighter text-danger-dark ring-danger/15', icon: <XCircle className="h-3.5 w-3.5" /> },
}

export const StatusBadge = ({ status, label, icon }: StatusBadgeProps) => {
  const current = statusConfig[status]

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', current.className)}>
      {icon ?? current.icon}
      <span>{label}</span>
    </span>
  )
}
