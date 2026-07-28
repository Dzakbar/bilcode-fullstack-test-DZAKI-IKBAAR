export type ToastType = 'success' | 'error'

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: number) => void
}

export function Toast({ onDismiss, toasts }: ToastProps) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed right-4 top-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <section
          className={[
            'rounded-xl border bg-white px-4 py-3 shadow-lg',
            toast.type === 'success' ? 'border-neutral-200' : 'border-red-200',
          ].join(' ')}
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 text-sm font-semibold text-neutral-950">{toast.type === 'success' ? 'Success' : 'Error'}</p>
              <p className="mt-1 text-sm leading-5 text-neutral-600">{toast.message}</p>
            </div>
            <button
              className="rounded-md px-2 text-lg leading-6 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
              type="button"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
            >
              ×
            </button>
          </div>
        </section>
      ))}
    </div>
  )
}
