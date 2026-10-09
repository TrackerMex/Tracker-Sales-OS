import type { ParsedApiError } from "@/shared/lib/api-errors"
import { cn } from "@/lib/utils"
import { AlertCircleIcon } from "@/shared/components/Icon"
import { STATUS_TILE_CLASS } from "@/shared/lib/status"

interface Props {
  error: ParsedApiError | null
  className?: string
}

export function FormErrorSummary({ error, className }: Props) {
  if (!error) return null
  const single = error.details.length === 1
  return (
    // The tile tint is translucent; the bg-background layer under it keeps
    // the text AA on any surface, including legacy dark panels.
    <div role="alert" className={cn("bg-background", className)}>
      <div
        className={cn(
          "flex items-start gap-2.5 border px-3.5 py-3",
          STATUS_TILE_CLASS.danger
        )}
      >
        <AlertCircleIcon aria-hidden="true" className="mt-0.5 shrink-0" />
        <div className="text-sm leading-relaxed">
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
    </div>
  )
}
