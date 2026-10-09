import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

// Page title block from the shadcn-dashboard template (overview-tab.tsx). It
// sits above the bento; the shell header no longer shows the page title.
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
      <div className="flex min-w-0 flex-col items-start">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
