import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  confirmLabel = 'Confirm',
  isLoading = false,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/40 px-4 py-6" role="presentation">
      <section
        className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title" className="m-0 text-lg font-semibold text-neutral-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" disabled={isLoading} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" isLoading={isLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  )
}
