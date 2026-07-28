import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
}

export function Button({
  children,
  className = '',
  disabled,
  isLoading = false,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ')

  return (
    <button className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading ? 'Please wait...' : children}
    </button>
  )
}
