import { useEffect, useRef, useState } from "react"
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon } from "@hugeicons/core-free-icons"
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
import { DealPeek } from "./DealPeek"

const STAGE_BADGE_COLORS: Record<string, string> = {
  Prospecto: "#002B49",
  Contactado: "#1E40AF",
  Interesado: "#82bc00",
  Propuesta: "#D97706",
  Negociación: "#7C3AED",
  Cierre: "#059669",
  Perdido: "#DC2626",
}

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
  const badgeColor = STAGE_BADGE_COLORS[deal.stage] || "#002B49"
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
        "card mb-2 p-3.5 transition-[box-shadow,opacity]",
        isDragging
          ? "cursor-grabbing opacity-50"
          : "cursor-grab hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-[1.3] font-bold text-tracker-blue">
            {deal.clientName}
          </p>
          {deal.opportunityName && (
            <p className="mt-px truncate text-[11px] font-semibold text-tracker-purple">
              {deal.opportunityName}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            style={{
              background: badgeColor,
            }}
            className="rounded-[10px] px-2 py-0.5 text-[10px] font-bold text-white uppercase"
          >
            {deal.stage}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Vista rápida"
                className="bg-transparent text-tracker-text-muted hover:bg-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
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
        <p className="mb-0.5 text-[11px] text-tracker-text-secondary">
          {contactInfo}
        </p>
      )}

      {deal.painPoint && (
        <p className="mb-1.5 line-clamp-2 text-[11px] leading-[1.4] text-tracker-text-dim">
          {deal.painPoint}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        {deal.sellerName &&
          (teamMode ? (
            <Badge variant="navy">{deal.sellerName}</Badge>
          ) : (
            <span className="text-[11px] text-tracker-text-muted">
              {deal.sellerName}
            </span>
          ))}
        <div className="flex items-center gap-1.5">
          {(showRed || showAmber) && (
            <span
              className={cn(
                "rounded-[10px] px-1.5 py-0.5 text-[10px] font-bold text-white",
                showRed ? "bg-red-500" : "bg-amber-500"
              )}
            >
              {daysStalled}d
            </span>
          )}
          <span className="text-[11px] text-tracker-text-muted">
            {activityDate ? formatDate(activityDate) : ""}
          </span>
        </div>
      </div>
    </div>
  )
}
