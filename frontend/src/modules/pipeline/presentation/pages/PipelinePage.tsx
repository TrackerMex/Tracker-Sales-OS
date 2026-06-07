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
    <div className="flex gap-4">
      {ALL_STAGES.map((stage) => (
        <div
          key={stage}
          className="h-48 w-64 shrink-0 animate-pulse rounded-lg bg-slate-200"
        />
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
      {
        onSuccess: () => handleCloseModal(),
      }
    )
  }

  function getDeals(stage: PipelineStage): Deal[] {
    if (!grouped) return []
    return grouped[stage] ?? []
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#002B49]">Pipeline</h2>
          <p className="mt-1 text-sm text-slate-500">Vista Kanban por stage</p>
        </div>
      </div>

      {isLoading && <SkeletonColumns />}
      {isError && (
        <p className="text-sm text-red-600">No se pudo cargar el pipeline.</p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-bold text-[#002B49]">
              Nuevo deal — {modal.stage}
            </h3>
            <form onSubmit={handleCreateDeal} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Client ID
                </label>
                <input
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="UUID del cliente"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A8E8]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Monto (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A8E8]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createDeal.isPending}
                  className="flex-1 rounded-md bg-[#002B49] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#002B49]/90 disabled:opacity-50"
                >
                  {createDeal.isPending ? "Guardando..." : "Crear"}
                </button>
              </div>
              {createDeal.isError && (
                <p className="text-xs text-red-600">
                  {createDeal.error instanceof Error
                    ? createDeal.error.message
                    : "No se pudo crear el deal"}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
