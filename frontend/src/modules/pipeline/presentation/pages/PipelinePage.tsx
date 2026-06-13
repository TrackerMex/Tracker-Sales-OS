import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element"
import { useAppStore } from "@/shared/store/app.store"
import { usePipeline } from "../../application/hooks/usePipeline"
import { useCreateDeal } from "../../application/hooks/useCreateDeal"
import { useChangeStage } from "../../application/hooks/useChangeStage"
import { KanbanColumn } from "../components/KanbanColumn"
import { ClientDetailPage } from "./ClientDetailPage"
import type { PipelineStage, Deal, PipelineGrouped } from "../../domain/pipeline.types"
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
  onCreateDeal: (stage: PipelineStage) => void
  onDealClick: (deal: Deal) => void
}

function KanbanBoard({ grouped, onChangeStage, onCreateDeal, onDealClick }: KanbanBoardProps) {
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
            onCreateDeal={onCreateDeal}
            onDealClick={onDealClick}
          />
        ))}
      </div>
    </div>
  )
}

interface CreateDealModal {
  stage: PipelineStage
}

export function PipelinePage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ""
  const username = currentUser?.username ?? ""

  const { data: grouped, isLoading, isError } = usePipeline()
  const createDeal = useCreateDeal()
  const changeStage = useChangeStage()

  const [modal, setModal] = useState<CreateDealModal | null>(null)
  const [clientId, setClientId] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)

  function handleChangeStage(dealId: string, newStage: PipelineStage) {
    changeStage.mutate({ dealId, input: { newStage, changedBy: username } })
  }

  function handleOpenCreate(stage: PipelineStage) {
    setModal({ stage })
    setClientId("")
    setAmount("")
  }

  function handleCloseModal() {
    setModal(null)
    setClientId("")
    setAmount("")
  }

  function handleCreateDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!modal) return

    createDeal.mutate(
      {
        clientId: clientId.trim(),
        sellerId,
        amount: amount ? Number(amount) : undefined,
        stage: modal.stage,
      },
      { onSuccess: () => handleCloseModal() }
    )
  }

  function handleDealClick(deal: Deal) {
    setSelectedDeal(deal)
  }

  if (selectedDeal) {
    return <ClientDetailPage deal={selectedDeal} />
  }

  const allDeals = grouped ? Object.values(grouped).flat() : []
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
        {grouped && (
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

      {isLoading && <SkeletonColumns />}
      {isError && (
        <p style={{ fontSize: 13, color: '#EF4444' }}>No se pudo cargar el pipeline.</p>
      )}

      {!isLoading && !isError && grouped && (
        <KanbanBoard
          grouped={grouped}
          onChangeStage={handleChangeStage}
          onCreateDeal={handleOpenCreate}
          onDealClick={handleDealClick}
        />
      )}

      {modal && (
        <div
          className="modal-blur fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal() }}
        >
          <div className="card w-full max-w-sm p-6">
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: '#002B49' }}>
              Nuevo deal — {modal.stage}
            </h3>
            <form onSubmit={handleCreateDeal} className="space-y-3">
              <div>
                <label className="slabel mb-1 block">Client ID</label>
                <input
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="UUID del cliente"
                  className="input"
                />
              </div>
              <div>
                <label className="slabel mb-1 block">Monto (opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="input"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={handleCloseModal} className="btn-ghost flex-1 justify-center">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createDeal.isPending}
                  className="btn-primary flex-1 justify-center"
                >
                  {createDeal.isPending ? "Guardando..." : "Crear"}
                </button>
              </div>
              {createDeal.isError && (
                <p style={{ fontSize: 12, color: '#EF4444' }}>
                  {createDeal.error instanceof Error ? createDeal.error.message : "No se pudo crear el deal"}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
