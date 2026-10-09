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
import type {
  PipelineStage,
  Deal,
  PipelineGrouped,
  LossReason,
} from "../../domain/pipeline.types"
import { formatCurrency } from "@/shared/lib/format"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

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
    <div
      className="flex gap-3 overflow-hidden"
      role="status"
      aria-label="Cargando pipeline"
    >
      {ALL_STAGES.map((stage) => (
        <Skeleton key={stage} className="h-48 w-63 shrink-0" />
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

function KanbanBoard({
  grouped,
  onChangeStage,
  onDealClick,
  teamMode,
}: KanbanBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    return autoScrollForElements({ element: el })
  }, [])

  return (
    // `pipeline-scroll` is kept only as a selector hook (QA scripts); the
    // scrollbar colors below override the legacy hex rule.
    <div
      ref={scrollRef}
      className="pipeline-scroll [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] overflow-x-auto pb-4"
    >
      <div className="flex min-w-max gap-3">
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
  const isAdminOrDirector =
    role === UserRole.Admin || role === UserRole.Director

  const [selectedSeller, setSelectedSeller] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pipeline_seller_filter") ?? "all"
    }
    return "all"
  })

  const { data: sellers = [] } = useSellers()

  const isTeamMode = isAdminOrDirector && selectedSeller === "all"

  const sellerIdForQuery = isTeamMode
    ? null
    : selectedSeller !== "all"
      ? selectedSeller
      : (currentUser?.sellerId ?? currentUser?.id ?? "")

  const {
    data: grouped,
    isLoading,
    isError,
  } = usePipeline(isTeamMode ? null : sellerIdForQuery)
  const {
    data: teamGrouped,
    isLoading: isTeamLoading,
    isError: isTeamError,
  } = useTeamPipeline(isTeamMode)

  const activeGrouped = isTeamMode ? teamGrouped : grouped
  const activeLoading = isTeamMode ? isTeamLoading : isLoading
  const activeError = isTeamMode ? isTeamError : isError

  const changeStage = useChangeStage()

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [lossModal, setLossModal] = useState<{ dealId: string } | null>(null)
  const [lossReason, setLossReason] = useState<LossReason | "">("")

  function handleSellerChange(value: string) {
    setSelectedSeller(value)
    localStorage.setItem("pipeline_seller_filter", value)
  }

  function handleChangeStage(dealId: string, newStage: PipelineStage) {
    if (newStage === "Perdido") {
      setLossReason("")
      setLossModal({ dealId })
      return
    }
    changeStage.mutate(
      { dealId, input: { newStage, changedBy: username } },
      {
        onSuccess: () => toast.success(`Movido a ${newStage}`),
        onError: () => toast.error("No se pudo cambiar la etapa"),
      }
    )
  }

  function handleConfirmLoss() {
    if (!lossModal) return
    changeStage.mutate(
      {
        dealId: lossModal.dealId,
        input: {
          newStage: "Perdido",
          changedBy: username,
          ...(lossReason ? { lossReason } : {}),
        },
      },
      {
        onSuccess: () => toast.success("Deal marcado como perdido"),
        onError: () => toast.error("No se pudo cambiar la etapa"),
      }
    )
    setLossModal(null)
    setLossReason("")
  }

  function handleDealClick(deal: Deal) {
    setSelectedDeal(deal)
  }

  const allDeals = activeGrouped ? Object.values(activeGrouped).flat() : []
  const openDeals = allDeals.filter((d) => d.stage !== "Perdido")
  const totalGross = openDeals.reduce((s, d) => s + (d.amount ?? 0), 0)
  const forecast = openDeals.reduce(
    (s, d) => s + ((d.amount ?? 0) * (d.probability ?? 0)) / 100,
    0
  )

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Fases comerciales por oportunidad"
        actions={
          <>
            {isAdminOrDirector && (
              <Select value={selectedSeller} onValueChange={handleSellerChange}>
                <SelectTrigger
                  className="w-auto min-w-40"
                  aria-label="Filtrar por vendedor"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los vendedores</SelectItem>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {activeGrouped && (
              <dl className="flex gap-6">
                <div>
                  <dt className="text-xs text-muted-foreground">Total bruto</dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {formatCurrency(totalGross)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Forecast ponderado
                  </dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {formatCurrency(forecast)}
                  </dd>
                </div>
              </dl>
            )}
          </>
        }
      />

      {activeLoading && <SkeletonColumns />}
      {activeError && (
        <div className="border border-destructive/20 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-status-danger">
            No se pudo cargar el pipeline.
          </p>
        </div>
      )}

      {!activeLoading && !activeError && activeGrouped && (
        <KanbanBoard
          grouped={activeGrouped}
          onChangeStage={handleChangeStage}
          onDealClick={handleDealClick}
          teamMode={isTeamMode}
        />
      )}

      <Dialog
        open={!!lossModal}
        onOpenChange={(open) => {
          if (!open) {
            setLossModal(null)
            setLossReason("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo de pérdida</DialogTitle>
            <DialogDescription>
              Registra un motivo opcional antes de marcar el deal como perdido.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="loss-reason" className="text-xs font-medium">
              Motivo (opcional)
            </Label>
            <Select
              value={lossReason}
              onValueChange={(v) =>
                setLossReason(v === "__none__" ? "" : (v as LossReason))
              }
            >
              <SelectTrigger id="loss-reason" className="mt-2 w-full">
                <SelectValue placeholder="Selecciona un motivo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin motivo</SelectItem>
                {LOSS_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setLossModal(null)
                setLossReason("")
              }}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLoss}
              disabled={changeStage.isPending}
            >
              {changeStage.isPending ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Peek Panel — slide-over */}
      <Sheet
        open={!!selectedDeal}
        onOpenChange={(open) => {
          if (!open) setSelectedDeal(null)
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[640px] data-[side=right]:lg:max-w-[720px]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Detalle de oportunidad</SheetTitle>
            <SheetDescription>
              Panel lateral con detalle del cliente y su historial comercial.
            </SheetDescription>
          </SheetHeader>
          {selectedDeal && (
            <ClientDetailPage
              deal={selectedDeal}
              onBack={() => setSelectedDeal(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
