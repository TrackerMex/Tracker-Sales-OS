import { useState, Fragment } from "react"
import { useNavigate } from "@tanstack/react-router"
import { CloseIcon, MoreHorizontalIcon } from "@/shared/components/Icon"
import { ActivityHistoryModal } from "@/modules/activities/presentation/components/ActivityHistoryModal"
import { useAppStore } from "@/shared/store/app.store"
import { PIPELINE_STAGES } from "@/shared/lib/constants"
import { useChangeStage } from "../../application/hooks/useChangeStage"
import { useClientDetail } from "../../application/hooks/useClientDetail"
import type { Deal, PipelineStage } from "../../domain/pipeline.types"
import { parseApiError } from "@/shared/lib/api-errors"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import {
  STATUS_BADGE_CLASS,
  STATUS_FILL_CLASS,
  STATUS_TILE_CLASS,
  statusTone,
} from "@/shared/lib/status"
import { cn } from "@/lib/utils"

interface Props {
  deal: Deal
  onBack: () => void
}

const STAGE_ORDER: PipelineStage[] = PIPELINE_STAGES.filter((s) => s !== "Perdido")

export function ClientDetailPage({ deal, onBack }: Props) {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const username = currentUser?.username ?? ""
  const changeStage = useChangeStage()
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { clientQuery, activities: clientActivities } = useClientDetail(deal)
  const { data: client } = clientQuery

  const currentIdx = STAGE_ORDER.indexOf(deal.stage as PipelineStage)

  function handleStageChange(newStage: PipelineStage) {
    changeStage.mutate({
      dealId: deal.id,
      input: { newStage, changedBy: username },
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background px-6 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">
            {deal.clientName}
          </h2>
          <p className="text-xs text-muted-foreground">
            {deal.sellerName ?? ""}
            {deal.sellerName ? " · " : ""}Oportunidad principal
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Cerrar"
        >
          <CloseIcon />
        </Button>
      </div>

      <section className="border-b px-6 py-4">
        <h3 className="mb-3 text-xs font-medium text-muted-foreground">
          Etapa actual
        </h3>

        <div className="flex items-start">
          {STAGE_ORDER.map((s, idx) => {
            const isPast = idx < currentIdx
            const isCurrent = idx === currentIdx
            return (
              <Fragment key={s}>
                <div className="flex w-10 shrink-0 flex-col items-center gap-1 sm:w-16">
                  <Button
                    size="icon-xs"
                    title={s}
                    aria-label={s}
                    onClick={() => handleStageChange(s)}
                    disabled={isCurrent}
                    className={cn(
                      "size-7 rounded-full",
                      isCurrent
                        ? cn(
                            STATUS_TILE_CLASS[statusTone(s)],
                            "font-semibold ring-1 ring-current disabled:opacity-100"
                          )
                        : isPast
                          ? "bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {idx + 1}
                  </Button>
                  <span
                    className={cn(
                      "w-full truncate text-center text-xs",
                      isCurrent ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {s}
                  </span>
                </div>
                {idx < STAGE_ORDER.length - 1 && (
                  <div
                    className={cn(
                      "mt-3.5 h-0.5 min-w-2 flex-1",
                      isPast ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </Fragment>
            )
          })}
          <div className="w-4 shrink-0" />
          <div className="flex w-10 shrink-0 flex-col items-center gap-1 sm:w-16">
            <Button
              size="icon-xs"
              title="Perdido"
              aria-label="Perdido"
              onClick={() => handleStageChange("Perdido")}
              disabled={deal.stage === "Perdido"}
              className={cn(
                "size-7 rounded-full",
                deal.stage === "Perdido"
                  ? cn(
                      STATUS_TILE_CLASS.danger,
                      "ring-1 ring-current disabled:opacity-100"
                    )
                  : cn(STATUS_BADGE_CLASS.danger, "hover:bg-destructive/20")
              )}
            >
              <CloseIcon />
            </Button>
            <span
              className={cn(
                "w-full truncate text-center text-xs",
                deal.stage === "Perdido"
                  ? "font-medium"
                  : "text-muted-foreground"
              )}
            >
              Perdido
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <StatusBadge status={deal.stage} />
          {deal.amount ? (
            <span className="tabular-nums">
              {deal.amount.toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN",
                minimumFractionDigits: 0,
              })}
            </span>
          ) : null}
          {deal.probability !== undefined ? (
            <span className="tabular-nums">{deal.probability}% prob</span>
          ) : null}
        </div>
      </section>

      <section className="border-b px-6 py-4">
        <h3 className="text-sm font-semibold">Información del cliente</h3>
        {clientQuery.isLoading ? (
          <Skeleton className="mt-3 h-24 w-full" aria-label="Cargando cliente" />
        ) : clientQuery.isError ? (
          <div role="alert" className="mt-3 text-sm text-status-danger">
            <p>{parseApiError(clientQuery.error).message}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => void clientQuery.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : <Accordion type="multiple" defaultValue={["contacts"]}>
          <AccordionItem value="contacts">
            <AccordionTrigger>Contactos</AccordionTrigger>
            <AccordionContent className="space-y-3">
              {client?.contacts && client.contacts.length > 0 ? (
                client.contacts.map((c) => (
                  <div key={c.id}>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.role}
                      {c.isDecisionMaker ? " · Principal" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.phone?.trim() || "Sin teléfono"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin contactos</p>
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pain">
            <AccordionTrigger>Dolor / necesidad</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm">{client?.pain ?? deal.painPoint ?? "-"}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="provider">
            <AccordionTrigger>Proveedor actual</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm">{client?.provider ?? "-"}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>}
      </section>

      <section className="flex-1 px-6 py-4">
        <h3 className="mb-4 text-sm font-semibold">Historial comercial</h3>
        {clientActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin actividades registradas
          </p>
        ) : (
          <div className="relative">
            <div className="absolute top-2 bottom-2 left-2.5 w-px bg-border" />
            <div className="flex flex-col gap-4">
              {clientActivities.map((activity) => (
                <div key={activity.id} className="relative flex gap-4">
                  <span
                    className={cn(
                      "z-1 mt-0.5 size-5 shrink-0 rounded-full border-2 border-background",
                      STATUS_FILL_CLASS[statusTone(activity.status ?? "")]
                    )}
                    title={activity.status}
                  >
                    <span className="sr-only">{activity.status}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary">{activity.type}</Badge>
                        {activity.stage && (
                          <StatusBadge status={activity.stage} />
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {new Date(activity.executedAt).toLocaleDateString(
                          "es-MX",
                          { day: "2-digit", month: "2-digit" }
                        )}
                      </span>
                    </div>
                    {activity.summary && (
                      <div className="mb-1">
                        <p className="text-sm">
                          {activity.summary.length > 120 &&
                          !expandedIds.has(activity.id)
                            ? activity.summary.slice(0, 120) + "..."
                            : activity.summary}
                        </p>
                        {activity.summary.length > 120 && (
                          <Button
                            variant="link"
                            size="xs"
                            className="h-auto px-0 py-0 text-muted-foreground"
                            onClick={() => toggleExpand(activity.id)}
                          >
                            {expandedIds.has(activity.id)
                              ? "Ver menos"
                              : "Ver más"}
                          </Button>
                        )}
                      </div>
                    )}
                    {activity.nextStep && (
                      <p className="text-xs font-medium">
                        → {activity.nextStep}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        +{activity.points}pts · {activity.quality}% cal.
                      </span>
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label="Acciones de actividad"
                              >
                                <MoreHorizontalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Acciones de actividad</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem
                            onSelect={() => setSelectedActivityId(activity.id)}
                          >
                            Ver detalle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="sticky bottom-0 border-t bg-background px-6 py-4">
        <Button
          size="lg"
          className="w-full"
          onClick={() =>
            navigate({
              to: "/actividades/nueva",
              search: { clientId: deal.clientId, clientName: deal.clientName },
            })
          }
        >
          Registrar avance
        </Button>
      </div>

      <ActivityHistoryModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </div>
  )
}
