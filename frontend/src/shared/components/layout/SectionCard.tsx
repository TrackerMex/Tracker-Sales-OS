import type { ReactNode } from "react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  /** 16px icon shown before the title, e.g. `<TeamIcon size={16} />`. */
  icon: ReactNode
  description?: ReactNode
  /** Right side of the header (range select, link, button). */
  actions?: ReactNode
  /** Id of the `<h2>`, for `aria-labelledby` inside the content. */
  titleId?: string
  /** Bento placement, e.g. `lg:col-span-7`. */
  className?: string
  contentClassName?: string
  children: ReactNode
}

// Bento cell with the template's card header (icon + title, bottom border).
// Content is full-bleed (`px-0`); pad inside or pass `contentClassName`.
export function SectionCard({
  title,
  icon,
  description,
  actions,
  titleId,
  className,
  contentClassName,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn("col-span-12 h-full gap-0 border-0 pb-0", className)}>
      <CardHeader className="border-b border-border">
        <CardTitle>
          <h2 id={titleId} className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            {title}
          </h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>
      <CardContent className={cn("flex-1 px-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
