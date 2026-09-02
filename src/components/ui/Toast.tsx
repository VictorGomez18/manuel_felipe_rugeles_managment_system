import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Toast = ({ type, message }: { type: 'success' | 'error' | 'warning'; message: string }) => {
  const styles = {
    success: { className: 'border-success/20 bg-white text-neutral-800', icon: <CheckCircle2 className="h-5 w-5 text-success" /> },
    error: { className: 'border-danger/20 bg-white text-neutral-800', icon: <XCircle className="h-5 w-5 text-danger" /> },
    warning: { className: 'border-accent/20 bg-white text-neutral-800', icon: <AlertTriangle className="h-5 w-5 text-accent-dark" /> },
  }

  const current = styles[type]

  return (
    <div className={cn('fixed bottom-4 right-4 z-[60] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-md', current.className)}>
      {current.icon}
      <p className="text-sm leading-6">{message}</p>
    </div>
  )
}


