import type { ReactNode } from "react"
import { FolderIcon } from "@/shared/components/Icon"

interface EmptyStateProps {
  /** 20px icon; defaults to a folder. */
  icon?: ReactNode
  title: string
  description?: string
  /** Optional CTA, usually an outline `Button`. */
  action?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <div className="rounded-md border border-border p-2.5 text-muted-foreground">
        {icon ?? <FolderIcon size={20} />}
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
