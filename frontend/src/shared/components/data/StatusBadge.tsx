import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import {
  STATUS_BADGE_CLASS,
  statusTone,
  type StatusTone,
} from "@/shared/lib/status"

interface StatusBadgeProps extends ComponentProps<"span"> {
  /** Business status; its tone comes from `shared/lib/status.ts` and it is the default label. */
  status?: string
  /** Explicit tone for values that are not a named status (scores, severities). */
  tone?: StatusTone
}

// Status pill (DESIGN.md "Estados"): rounded-full, tinted with the state token.
export function StatusBadge({
  status = "",
  tone,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-normal whitespace-nowrap",
        STATUS_BADGE_CLASS[tone ?? statusTone(status)],
        className
      )}
      {...props}
    >
      {children ?? status}
    </span>
  )
}
