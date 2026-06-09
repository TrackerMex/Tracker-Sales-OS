import { useState } from "react"
import type { Deal, PipelineStage } from "../../domain/pipeline.types"

const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  Prospecto: ["Contactado", "Perdido"],
  Contactado: ["Interesado", "Perdido"],
  Interesado: ["Propuesta", "Perdido"],
  Propuesta: ["Negociación", "Perdido"],
  Negociación: ["Cierre", "Perdido"],
  Cierre: [],
  Perdido: [],
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount)
}

function probabilityColor(probability: number): string {
  if (probability === 0) return "bg-red-100 text-red-700 border-red-300"
  if (probability >= 70) return "bg-green-100 text-green-700 border-green-300"
  if (probability >= 30)
    return "bg-yellow-100 text-yellow-700 border-yellow-300"
  return "bg-slate-100 text-slate-600 border-slate-200"
}

interface DealCardProps {
  deal: Deal
  onChangeStage: (dealId: string, newStage: PipelineStage) => void
}

export function DealCard({ deal, onChangeStage }: DealCardProps) {
  const [selectedStage, setSelectedStage] = useState<PipelineStage | "">("")
  const transitions = ALLOWED_TRANSITIONS[deal.stage] ?? []

  function handleMove() {
    if (!selectedStage) return
    onChangeStage(deal.id, selectedStage)
    setSelectedStage("")
  }

  return (
    <div className="card" style={{ padding: '14px' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-tight font-bold text-[#002B49]">
          {deal.clientName}
        </p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${probabilityColor(deal.probability)}`}
        >
          {deal.probability}%
        </span>
      </div>
      <p className="text-sm font-medium text-slate-600">
        {formatCurrency(deal.amount)}
      </p>

      {transitions.length > 0 && (
        <div className="flex items-center gap-1">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as PipelineStage)}
            className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
          >
            <option value="">Mover a...</option>
            {transitions.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          <button
            onClick={handleMove}
            disabled={!selectedStage}
            className="rounded-md bg-[#002B49] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-[#002B49]/90 disabled:opacity-40"
          >
            Mover
          </button>
        </div>
      )}
    </div>
  )
}
