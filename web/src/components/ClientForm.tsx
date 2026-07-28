import type { FormEvent } from 'react'
import type { ClientFormData } from '../types/client'

type ClientFieldErrors = Partial<Record<keyof ClientFormData, string>>

interface ClientFormProps {
  data: ClientFormData
  errors: ClientFieldErrors
  isSubmitting: boolean
  submitLabel: string
  cancelLabel?: string
  onChange: (field: keyof ClientFormData, value: string) => void
  onCancel?: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ClientForm({
  cancelLabel = 'Cancel',
  data,
  errors,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  submitLabel,
}: ClientFormProps) {
  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-900">Name</span>
        <input
          className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          name="name"
          value={data.name}
          required
          placeholder="Client name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'client-name-error' : undefined}
          onChange={(event) => onChange('name', event.target.value)}
        />
        {errors.name ? (
          <span className="text-sm text-red-700" id="client-name-error">
            {errors.name}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-900">Email</span>
        <input
          className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          name="email"
          type="email"
          value={data.email}
          required
          placeholder="client@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'client-email-error' : undefined}
          onChange={(event) => onChange('email', event.target.value)}
        />
        {errors.email ? (
          <span className="text-sm text-red-700" id="client-email-error">
            {errors.email}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-900">Company</span>
        <input
          className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          name="company"
          value={data.company}
          placeholder="Company name"
          aria-invalid={Boolean(errors.company)}
          aria-describedby={errors.company ? 'client-company-error' : undefined}
          onChange={(event) => onChange('company', event.target.value)}
        />
        {errors.company ? (
          <span className="text-sm text-red-700" id="client-company-error">
            {errors.company}
          </span>
        ) : null}
      </label>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        ) : null}
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
