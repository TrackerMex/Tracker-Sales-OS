import { useState } from "react"
import type { FormEvent } from "react"
import { useAppStore } from "@/shared/store/app.store"
import { usePipeline } from "../../application/hooks/usePipeline"
import { useCreateDeal } from "../../application/hooks/useCreateDeal"
import { useChangeStage } from "../../application/hooks/useChangeStage"
import { KanbanColumn } from "../components/KanbanColumn"
import type { PipelineStage, Deal } from "../../domain/pipeline.types"

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

  function getDeals(stage: PipelineStage): Deal[] {
    if (!grouped) return []
    return grouped[stage] ?? []
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Pipeline</h1>
        <p style={{ marginTop: 2, fontSize: 12, color: '#94A3B8' }}>Vista Kanban por stage</p>
      </div>

      {isLoading && <SkeletonColumns />}
      {isError && (
        <p style={{ fontSize: 13, color: '#EF4444' }}>No se pudo cargar el pipeline.</p>
      )}

      {!isLoading && !isError && (
        <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content' }}>
            {ALL_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={getDeals(stage)}
                onChangeStage={handleChangeStage}
                onCreateDeal={handleOpenCreate}
              />
            ))}
          </div>
        </div>
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
