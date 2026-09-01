import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export const Drawer = ({ open, onClose, title, description, children, footer }: DrawerProps) => {
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Cerrar panel" className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full justify-end">
        <section className="flex h-full w-full flex-col bg-white shadow-lg sm:max-w-[640px]">
          {(title || description) ? (
            <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {title ? <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">{title}</h2> : null}
                  {description ? <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-500">{description}</p> : null}
                </div>
                <button type="button" aria-label="Cerrar" onClick={onClose} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : null}
          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>
          {footer ? <div className={cn('sticky bottom-0 z-10 border-t border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6')}>{footer}</div> : null}
        </section>
      </div>
    </div>
  )
}
