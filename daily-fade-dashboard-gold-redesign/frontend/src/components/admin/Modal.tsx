import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export function Modal({ title, onClose, children, footer, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6`}
        style={{ boxShadow: 'var(--admin-shadow)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--admin-text)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--admin-text-subtle)] hover:text-[var(--admin-text)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>{children}</div>

        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}
