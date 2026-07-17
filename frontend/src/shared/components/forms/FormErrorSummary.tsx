import type { ParsedApiError } from "@/shared/lib/api-errors"
import { AlertCircleIcon } from "@/shared/components/Icon"

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
      className={`flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-100 px-3.5 py-3 text-tracker-danger-dark${className ? ` ${className}` : ""}`}
    >
      <AlertCircleIcon aria-hidden="true" className="mt-px shrink-0" />
      <div className="text-xs leading-relaxed font-medium">
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
