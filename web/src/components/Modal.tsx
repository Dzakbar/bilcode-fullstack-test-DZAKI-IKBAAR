import { type ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ children, description, isOpen, onClose, title }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex min-h-screen items-center justify-center bg-black/40 px-4 py-6" role="presentation">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close modal" onClick={onClose} />
      <section
        className="relative z-10 w-full max-w-xl rounded-xl border border-neutral-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
          <div>
            <h2 id="modal-title" className="m-0 text-xl font-semibold tracking-tight text-neutral-950">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p> : null}
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-xl leading-none text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            type="button"
            aria-label="Close modal"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
      </section>
    </div>
  )
}

