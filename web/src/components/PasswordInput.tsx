import { useState } from 'react'
import { TextInput } from './TextInput'

interface PasswordInputProps {
  label: string
  name: string
  value: string
  error?: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

export function PasswordInput({ error, label, name, onChange, value }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="password-field">
      <TextInput
        autoComplete="current-password"
        error={error}
        label={label}
        name={name}
        onChange={onChange}
        required
        type={isVisible ? 'text' : 'password'}
        value={value}
      />
      <button
        className="password-toggle"
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
      >
        {isVisible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
