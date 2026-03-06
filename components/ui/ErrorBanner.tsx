'use client'

export default function ErrorBanner({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:no-underline flex-shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  )
}
