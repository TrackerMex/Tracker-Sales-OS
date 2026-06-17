import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element"
import { useAppStore } from "@/shared/store/app.store"
import { usePipeline } from "../../application/hooks/usePipeline"
import { useTeamPipeline } from "../../application/hooks/useTeamPipeline"
import { useChangeStage } from "../../application/hooks/useChangeStage"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { KanbanColumn } from "../components/KanbanColumn"
import { ClientDetailPage } from "./ClientDetailPage"
import { UserRole } from "@/core/domain/types/common.types"
import type { PipelineStage, Deal, PipelineGrouped, LossReason } from "../../domain/pipeline.types"
import { formatCurrency } from "@/shared/lib/format"

const ALL_STAGES: PipelineStage[] = [
  "Prospecto",
  "Contactado",
  "Interesado",
  "Propuesta",
  "Negociación",
  "Cierre",
  "Perdido",
]

function SkeletonColumns() {
  return (
    <div className="flex gap-3">
      {ALL_STAGES.map((stage) => (
        <div key={stage} className="h-48 w-64 shrink-0 animate-pulse rounded-lg bg-slate-200" />
      ))}
    </div>
  )
}

interface KanbanBoardProps {
  grouped: PipelineGrouped
  onChangeStage: (dealId: string, newStage: PipelineStage) => void
  onDealClick: (deal: Deal) => void
  teamMode?: boolean
}

function KanbanBoard({ grouped, onChangeStage, onDealClick, teamMode }: KanbanBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    return autoScrollForElements({ element: el })
  }, [])

  return (
    <div ref={scrollRef} className="pipeline-scroll" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content' }}>
        {ALL_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={grouped[stage] ?? []}
            onChangeStage={onChangeStage}
            onDealClick={onDealClick}
            teamMode={teamMode}
          />
        ))}
      </div>
    </div>
  )
}

const LOSS_REASONS: { value: LossReason; label: string }[] = [
  { value: "precio", label: "Precio" },
  { value: "competencia", label: "Competencia" },
  { value: "sin_respuesta", label: "Sin respuesta" },
  { value: "timing", label: "Timing" },
  { value: "otro", label: "Otro" },
]

export function PipelinePage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const username = currentUser?.username ?? ""

  const role = currentUser?.role
  const isAdminOrDirector = role === UserRole.Admin || role === UserRole.Director

  const [selectedSeller, setSelectedSeller] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pipeline_seller_filter') ?? 'all'
    }
    return 'all'
  })

  const { data: sellers = [] } = useSellers()

  const isTeamMode = isAdminOrDirector && selectedSeller === 'all'

  const sellerIdForQuery = isTeamMode
    ? null
    : (selectedSeller !== 'all' ? selectedSeller : (currentUser?.sellerId ?? currentUser?.id ?? ''))

  const { data: grouped, isLoading, isError } = usePipeline(isTeamMode ? null : sellerIdForQuery)
  const { data: teamGrouped, isLoading: isTeamLoading, isError: isTeamError } = useTeamPipeline(isTeamMode)

  const activeGrouped = isTeamMode ? teamGrouped : grouped
  const activeLoading = isTeamMode ? isTeamLoading : isLoading
  const activeError = isTeamMode ? isTeamError : isError

  const changeStage = useChangeStage()

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [lossModal, setLossModal] = useState<{ dealId: string } | null>(null)
  const [lossReason, setLossReason] = useState<LossReason | "">("")

  function handleSellerChange(value: string) {
    setSelectedSeller(value)
    localStorage.setItem('pipeline_seller_filter', value)
  }

  function handleChangeStage(dealId: string, newStage: PipelineStage) {
    if (newStage === "Perdido") {
      setLossReason("")
      setLossModal({ dealId })
      return
    }
    changeStage.mutate({ dealId, input: { newStage, changedBy: username } }, {
      onSuccess: () => toast.success(`Movido a ${newStage}`),
      onError: () => toast.error("No se pudo cambiar la etapa"),
    })
  }

  function handleConfirmLoss() {
    if (!lossModal) return
    changeStage.mutate({
      dealId: lossModal.dealId,
      input: {
        newStage: "Perdido",
        changedBy: username,
        ...(lossReason ? { lossReason } : {}),
      },
    }, {
      onSuccess: () => toast.success("Deal marcado como perdido"),
      onError: () => toast.error("No se pudo cambiar la etapa"),
    })
    setLossModal(null)
    setLossReason("")
  }

  function handleDealClick(deal: Deal) {
    setSelectedDeal(deal)
  }

  if (selectedDeal) {
    return <ClientDetailPage deal={selectedDeal} onBack={() => setSelectedDeal(null)} />
  }

  const allDeals = activeGrouped ? Object.values(activeGrouped).flat() : []
  const openDeals = allDeals.filter((d) => d.stage !== "Perdido")
  const totalGross = openDeals.reduce((s, d) => s + (d.amount ?? 0), 0)
  const forecast = openDeals.reduce((s, d) => s + (d.amount ?? 0) * (d.probability ?? 0) / 100, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Pipeline</h1>
          <p style={{ marginTop: 2, fontSize: 12, color: '#94A3B8' }}>Fases comerciales por oportunidad</p>
        </div>
        <div className="flex items-center gap-4">
          {isAdminOrDirector && (
            <select
              value={selectedSeller}
              onChange={(e) => handleSellerChange(e.target.value)}
              className="input"
              style={{ fontSize: 12, padding: '5px 10px', minWidth: 160 }}
            >
              <option value="all">Todos los vendedores</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {activeGrouped && (
            <div className="flex gap-6 text-right">
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Total bruto</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#002B49' }}>{formatCurrency(totalGross)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Forecast ponderado</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#002B49' }}>{formatCurrency(forecast)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeLoading && <SkeletonColumns />}
      {activeError && (
        <p style={{ fontSize: 13, color: '#EF4444' }}>No se pudo cargar el pipeline.</p>
      )}

      {!activeLoading && !activeError && activeGrouped && (
        <KanbanBoard
          grouped={activeGrouped}
          onChangeStage={handleChangeStage}
          onDealClick={handleDealClick}
          teamMode={isTeamMode}
        />
      )}

      {lossModal && (
        <div
          className="modal-blur fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setLossModal(null); setLossReason("") } }}
        >
          <div className="card w-full max-w-sm p-6">
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: '#002B49' }}>
              Motivo de pérdida
            </h3>
            <div className="space-y-3">
              <div>
                <label className="slabel mb-1 block">Motivo (opcional)</label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value as LossReason | "")}
                  className="input"
                >
                  <option value="">Selecciona un motivo...</option>
                  {LOSS_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setLossModal(null); setLossReason("") }}
                  className="btn-ghost flex-1 justify-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLoss}
                  disabled={changeStage.isPending}
                  className="btn-primary flex-1 justify-center"
                >
                  {changeStage.isPending ? "Guardando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
