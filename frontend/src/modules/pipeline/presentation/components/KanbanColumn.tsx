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

  return (
    <div
      ref={columnRef}
      className={cn(
        "pipe-col transition-[border-color,background-color]",
        isDragOver && "border-tracker-green bg-[rgba(130,188,0,0.05)]"
      )}
    >
      <div className="pipe-col-h">
        <span>{stage}</span>
        <span className="inline-block min-w-[22px] rounded-[10px] bg-tracker-border px-1.5 py-0.5 text-center text-[11px] font-bold text-tracker-text-secondary">
          {deals.length}
        </span>
      </div>
      <div className="pipe-col-body">
        {deals.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-300">
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
