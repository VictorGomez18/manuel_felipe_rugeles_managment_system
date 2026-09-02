import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-neutral-300 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-neutral-700 mb-1">{title}</h3>
      {description ? <p className="text-sm text-neutral-500 mb-4">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  )
}



