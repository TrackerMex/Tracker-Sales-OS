import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertCircleIcon } from "@/shared/components/Icon"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import type { StatusTone } from "@/shared/lib/status"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: ReactNode
  /** 16px icon shown in the bordered box, e.g. `<DollarIcon size={16} />`. */
  icon?: ReactNode
  /** Delta / progress badge next to the value. */
  badge?: { label: string; tone: StatusTone }
  description?: ReactNode
  /** Explanation shown in a tooltip next to the label. */
  hint?: string
  /** Extra content under the description (e.g. a progress bar). */
  children?: ReactNode
  className?: string
}

// KPI card from the template (dashboards/modern/total-orders.tsx). Meant to be
// a bento cell: no border, no shadow, full height.
export function StatCard({
  label,
  value,
  icon,
  badge,
  description,
  hint,
  children,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("h-full gap-0 border-0 py-6", className)}>
      <CardContent className="flex flex-col gap-4 px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-foreground">{label}</p>
              {hint && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={`Qué es ${label}`}
                    >
                      <AlertCircleIcon size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-60">{hint}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-2xl font-semibold text-foreground">
                {value}
              </div>
              {badge && (
                <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
              )}
            </div>
          </div>
          {icon && (
            <div className="w-fit shrink-0 rounded-md border border-border p-2.5 text-foreground">
              {icon}
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
