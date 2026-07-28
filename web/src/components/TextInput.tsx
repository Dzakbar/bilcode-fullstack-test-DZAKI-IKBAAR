import type { InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
}

export function TextInput({ error, id, label, name, ...props }: TextInputProps) {
  const inputId = id ?? name
  const errorId = `${inputId}-error`

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} name={name} aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)} {...props} />
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
