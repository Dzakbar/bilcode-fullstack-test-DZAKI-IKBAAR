interface AlertProps {
  children: React.ReactNode
  title?: string
}

export function Alert({ children, title = 'Notice' }: AlertProps) {
  return (
    <section className="alert" role="alert" aria-live="assertive">
      <strong>{title}</strong>
      <div>{children}</div>
    </section>
  )
}
