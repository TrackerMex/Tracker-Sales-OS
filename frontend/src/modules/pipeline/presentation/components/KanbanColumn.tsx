import type { Deal, PipelineStage } from "../../domain/pipeline.types"
import { DealCard } from "./DealCard"

const STAGE_HEADER_COLOR: Record<PipelineStage, string> = {
  Prospecto: "bg-[#002B49]",
  Contactado: "bg-[#002B49]",
  Interesado: "bg-[#002B49]",
  Propuesta: "bg-[#002B49]",
  Negociación: "bg-[#002B49]",
  Cierre: "bg-green-700",
  Perdido: "bg-red-700",
}

const NO_CREATE_STAGES: PipelineStage[] = ["Cierre", "Perdido"]

interface KanbanColumnProps {
  stage: PipelineStage
  deals: Deal[]
  onChangeStage: (dealId: string, newStage: PipelineStage) => void
  onCreateDeal: (stage: PipelineStage) => void
}

export function KanbanColumn({
  stage,
  deals,
  onChangeStage,
  onCreateDeal,
}: KanbanColumnProps) {
  const headerColor = STAGE_HEADER_COLOR[stage]
  const canCreate = !NO_CREATE_STAGES.includes(stage)

  return (
    <div className="flex w-64 shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div
        className={`${headerColor} flex items-center justify-between px-3 py-2`}
      >
        <span className="text-sm font-bold text-white">{stage}</span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
            {deals.length}
          </span>
          {canCreate && (
            <button
              onClick={() => onCreateDeal(stage)}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white transition-colors hover:bg-white/30"
              title={`Crear deal en ${stage}`}
            >
              +
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[calc(100vh-220px)] flex-1 space-y-2 overflow-y-auto p-2">
        {deals.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">Sin deals</p>
        ) : (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onChangeStage={onChangeStage} />
          ))
        )}
      </div>
    </div>
  )
}
