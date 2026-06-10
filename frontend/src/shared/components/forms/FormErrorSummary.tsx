import type { ParsedApiError } from '@/shared/lib/api-errors'

interface Props {
  error: ParsedApiError | null
  className?: string
}

export function FormErrorSummary({ error, className }: Props) {
  if (!error) return null
  const single = error.details.length === 1
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3${className ? ` ${className}` : ''}`}
      style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c' }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="text-xs font-medium leading-relaxed">
        <p>{single ? error.details[0] : error.message}</p>
        {error.details.length > 1 && (
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {error.details.map((detail, i) => (
              <li key={i}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
