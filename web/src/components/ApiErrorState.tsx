interface ApiErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ApiErrorState({ message, onRetry }: ApiErrorStateProps) {
  return (
    <section className="api-error-state" role="alert" aria-live="assertive">
      <h2>Unable to load this content</h2>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </section>
  )
}
