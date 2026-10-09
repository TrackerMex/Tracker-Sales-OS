import { useEffect, useRef, useState } from "react"
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import type { Deal, PipelineStage } from "../../domain/pipeline.types"
import { DealCard } from "./DealCard"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  stage: PipelineStage
  deals: Deal[]
  onChangeStage: (dealId: string, newStage: PipelineStage) => void
  onDealClick: (deal: Deal) => void
  teamMode?: boolean
}

export function KanbanColumn({
  stage,
  deals,
  onChangeStage,
  onDealClick,
  teamMode,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const columnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = columnRef.current
    if (!el) return
    return dropTargetForElements({
      element: el,
      getData: () => ({ stage }),
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
      onDrop: ({ source }) => {
        const dealId = source.data.dealId as string
        if (dealId) onChangeStage(dealId, stage)
        setIsDragOver(false)
      },
    })
  }, [stage, onChangeStage])

  // `pipe-col` is kept only as a selector hook (QA scripts); every visual
  // property comes from utilities so the legacy rule can be deleted in 012.
  return (
    <div
      ref={columnRef}
      className={cn(
        "pipe-col w-63 max-w-63 min-w-63 shrink-0 rounded-none border border-border bg-muted/30 p-3 transition-[box-shadow,background-color]",
        isDragOver && "bg-primary/5 ring-1 ring-primary"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b pb-2">
        <h2 className="text-sm font-medium">{stage}</h2>
        <span className="min-w-6 rounded-full bg-muted px-2 py-0.5 text-center text-xs font-medium tabular-nums">
          {deals.length}
        </span>
      </div>
      <div className="flex max-h-[calc(100vh-260px)] [scrollbar-width:thin] flex-col gap-2 overflow-y-auto">
        {deals.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Sin oportunidades
          </p>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={onDealClick}
              teamMode={teamMode}
            />
          ))
        )}
      </div>
    </div>
  )
}
