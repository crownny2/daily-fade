import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  isSubmitting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-alt)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={
              danger
                ? 'flex items-center gap-2 rounded-lg bg-[var(--admin-danger)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                : 'flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60'
            }
          >
            {isSubmitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {danger && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]">
            <AlertTriangle className="h-5 w-5" />
          </span>
        )}
        <p className="text-sm text-[var(--admin-text-muted)]">{message}</p>
      </div>
    </Modal>
  )
}
