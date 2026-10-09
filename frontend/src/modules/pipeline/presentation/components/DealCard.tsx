import { useEffect, useRef, useState } from "react"
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { EyeIcon } from "@/shared/components/Icon"
import type { Deal } from "../../domain/pipeline.types"
import { useSettings } from "@/modules/settings/application/hooks/useSettings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import { DealPeek } from "./DealPeek"

const PAGE_LOADED_AT = Date.now()

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

interface DealCardProps {
  deal: Deal
  onClick: (deal: Deal) => void
  teamMode?: boolean
}

export function DealCard({ deal, onClick, teamMode }: DealCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [currentTime, setCurrentTime] = useState(PAGE_LOADED_AT)
  const ref = useRef<HTMLDivElement>(null)
  const contactInfo = [deal.contactName, deal.contactRole]
    .filter(Boolean)
    .join(" · ")
  const { data: settings } = useSettings()
  const activityDate = deal.updatedAt ?? deal.createdAt

  const daysStalled = activityDate
    ? Math.floor((currentTime - new Date(activityDate).getTime()) / 86400000)
    : 0
  const amberDays = settings?.stalledAmberDays ?? 7
  const redDays = settings?.stalledRedDays ?? 14
  const showRed = daysStalled >= redDays
  const showAmber = !showRed && daysStalled >= amberDays

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return draggable({
      element: el,
      getInitialData: () => ({ dealId: deal.id as string, type: "deal" }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    })
  }, [deal.id])

  return (
    <div
      ref={ref}
      onClick={() => onClick(deal)}
      className={cn(
        "rounded-lg border bg-background p-3 transition-[background-color,opacity]",
        isDragging
          ? "cursor-grabbing opacity-50"
          : "cursor-grab hover:bg-muted/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{deal.clientName}</p>
          {deal.opportunityName && (
            <p className="truncate text-xs text-muted-foreground">
              {deal.opportunityName}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge status={deal.stage} />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Vista rápida"
                className="text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <EyeIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-auto p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <DealPeek deal={deal} onOpenDetail={onClick} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {contactInfo && (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {contactInfo}
        </p>
      )}

      {deal.painPoint && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {deal.painPoint}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        {deal.sellerName &&
          (teamMode ? (
            <Badge variant="secondary" className="max-w-full truncate">
              {deal.sellerName}
            </Badge>
          ) : (
            <span className="truncate text-xs text-muted-foreground">
              {deal.sellerName}
            </span>
          ))}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {(showRed || showAmber) && (
            <StatusBadge
              tone={showRed ? "danger" : "pending"}
              title={`${daysStalled} días sin actividad`}
            >
              {daysStalled}d
            </StatusBadge>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {activityDate ? formatDate(activityDate) : ""}
          </span>
        </div>
      </div>
    </div>
  )
}
