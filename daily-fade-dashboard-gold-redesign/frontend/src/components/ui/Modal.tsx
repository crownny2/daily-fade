import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade-up"
        style={{ animationDuration: '0.2s' }}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-canvas-raised shadow-card animate-fade-up">
        {title && (
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h3 className="font-display text-lg text-ink">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-ink-faint hover:text-ink transition-colors cursor-pointer text-xl leading-none"
            >
              &times;
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}
