import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PeekHeader({
  title,
  badge,
}: {
  title: string
  badge?: ReactNode
}) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2">
      <p className="truncate text-sm font-medium text-foreground">{title}</p>
      {badge}
    </div>
  )
}

export function PeekRow({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 py-0.5",
        className
      )}
    >
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-right text-sm text-foreground">
        {value}
      </span>
    </div>
  )
}

export function PeekActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex gap-2 border-t border-border pt-2.5">
      {children}
    </div>
  )
}
