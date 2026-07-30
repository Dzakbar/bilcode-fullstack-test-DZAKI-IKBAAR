import type { FormEvent } from 'react'
import type { Client } from '../types/client'
import type { ProjectFormData, ProjectStatus } from '../types/project'

export type ProjectFieldErrors = Partial<Record<keyof ProjectFormData | 'brief' | 'deadline', string>>

interface ProjectFormProps {
  data: ProjectFormData
  errors: ProjectFieldErrors
  clients: Client[]
  isSubmitting: boolean
  submitLabel: string
  cancelLabel?: string
  onChange: (field: keyof ProjectFormData, value: string | ProjectStatus) => void
  onCancel?: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

export function ProjectForm({
  cancelLabel = 'Cancel',
  clients,
  data,
  errors,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  submitLabel,
}: ProjectFormProps) {
  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-900">Project Name *</span>
        <input
          className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          name="name"
          value={data.name}
          required
          placeholder="e.g. Mobile App Redesign"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'project-name-error' : undefined}
          onChange={(event) => onChange('name', event.target.value)}
        />
        {errors.name ? (
          <span className="text-sm text-red-700" id="project-name-error">
            {errors.name}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-900">Brief</span>
        <textarea
          className="min-h-24 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          name="description"
          value={data.description ?? ''}
          placeholder="Project brief or description"
          rows={4}
          aria-invalid={Boolean(errors.brief)}
          aria-describedby={errors.brief ? 'project-brief-error' : undefined}
          onChange={(event) => onChange('description', event.target.value)}
        />
        {errors.brief ? (
          <span className="text-sm text-red-700" id="project-brief-error">
            {errors.brief}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-900">Client *</span>
        <select
          className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-950 transition focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          name="client_id"
          value={data.client_id}
          required
          aria-invalid={Boolean(errors.client_id)}
          aria-describedby={errors.client_id ? 'project-client-error' : undefined}
          onChange={(event) => onChange('client_id', event.target.value)}
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} {client.company ? `(${client.company})` : ''}
            </option>
          ))}
        </select>
        {errors.client_id ? (
          <span className="text-sm text-red-700" id="project-client-error">
            {errors.client_id}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-900">Deadline</span>
        <input
          className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          name="due_date"
          type="date"
          value={data.due_date ?? ''}
          aria-invalid={Boolean(errors.deadline)}
          aria-describedby={errors.deadline ? 'project-deadline-error' : undefined}
          onChange={(event) => onChange('due_date', event.target.value)}
        />
        {errors.deadline ? (
          <span className="text-sm text-red-700" id="project-deadline-error">
            {errors.deadline}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-900">Status *</span>
        <select
          className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-950 transition focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          name="status"
          value={data.status}
          required
          aria-invalid={Boolean(errors.status)}
          aria-describedby={errors.status ? 'project-status-error' : undefined}
          onChange={(event) => onChange('status', event.target.value as ProjectStatus)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status ? (
          <span className="text-sm text-red-700" id="project-status-error">
            {errors.status}
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
