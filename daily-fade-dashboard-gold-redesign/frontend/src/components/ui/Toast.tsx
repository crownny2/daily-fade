import { useToast } from '@/hooks/useToast'
import type { ToastVariant } from '@/context/ToastContext'
import { cn } from '@/utils/cn'

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-success text-success',
  error: 'border-danger text-danger',
  info: 'border-ink text-ink',
}

export function ToastViewport() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'animate-fade-up flex items-start justify-between gap-3 border bg-canvas-raised px-4 py-3 shadow-card text-sm',
            variantClasses[toast.variant]
          )}
        >
          <span className="text-ink">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-ink-faint hover:text-ink cursor-pointer leading-none"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
