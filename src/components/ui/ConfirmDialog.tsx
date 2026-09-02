import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  isLoading = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone === 'danger' ? 'bg-danger-lighter text-danger-dark' : 'bg-primary-lighter text-primary'}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        {children}
      </div>
    </Modal>
  )
}


