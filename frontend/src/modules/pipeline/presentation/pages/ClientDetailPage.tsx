import { useState, Fragment } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons"
import { clientsApi } from "@/modules/clients/infrastructure/clients.api"
import { activitiesApi } from "@/modules/activities/infrastructure/activities.api"
import { ActivityHistoryModal } from "@/modules/activities/presentation/components/ActivityHistoryModal"
import { useAppStore } from "@/shared/store/app.store"
import { useChangeStage } from "../../application/hooks/useChangeStage"
import type { Deal, PipelineStage } from "../../domain/pipeline.types"
import type { Activity } from "@/modules/activities/domain/activities.types"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  deal: Deal
  onBack: () => void
}

const STAGE_COLORS: Record<string, string> = {
  Prospecto: "#002B49",
  Contactado: "#1E40AF",
  Interesado: "#82bc00",
  Propuesta: "#D97706",
  Negociación: "#7C3AED",
  Cierre: "#059669",
  Perdido: "#DC2626",
}

const STAGE_ORDER: PipelineStage[] = [
  "Prospecto",
  "Contactado",
  "Interesado",
  "Propuesta",
  "Negociación",
  "Cierre",
]

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

  const { data: client } = useQuery({
    queryKey: ["clients", deal.clientId],
    queryFn: () =>
      clientsApi
        .getClients({ limit: 100 })
        .then((r) => r.data.find((c) => c.id === deal.clientId)),
    enabled: !!deal.clientId,
  })

  const { data: dealActivities } = useQuery({
    queryKey: ["activities", "client", deal.clientId, deal.sellerId],
    queryFn: () => activitiesApi.getClientActivities(deal.clientId!),
    enabled: !!deal.clientId,
  })

  const clientActivities: Activity[] = (dealActivities ?? []).filter(
    (a) => a.sellerId === deal.sellerId
  )

  const currentIdx = STAGE_ORDER.indexOf(deal.stage as PipelineStage)

  function handleStageChange(newStage: PipelineStage) {
    changeStage.mutate({
      dealId: deal.id,
      input: { newStage, changedBy: username },
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-tracker-border bg-white px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-tracker-blue">
            {deal.clientName}
          </h2>
          <p className="text-[11px] text-tracker-text-secondary">
            {deal.sellerName ?? ""}
            {deal.sellerName ? " · " : ""}Oportunidad principal
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label="Cerrar"
          className="bg-transparent text-[22px] leading-none text-tracker-text-muted hover:bg-slate-100"
        >
          ×
        </Button>
      </div>

      {/* Stage Stepper */}
      <div className="border-b border-tracker-border px-5 py-4">
        <p className="mb-3 text-[10px] font-bold text-tracker-text-muted uppercase">
          Etapa actual
        </p>

        {/* Dots + connectors */}
        <div className="mb-2 flex items-center">
          {STAGE_ORDER.map((s, idx) => {
            const isPast = idx < currentIdx
            const isCurrent = idx === currentIdx
            return (
              <Fragment key={s}>
                <Button
                  size="icon-xs"
                  title={s}
                  onClick={() => handleStageChange(s)}
                  disabled={isCurrent}
                  className={cn(
                    "size-7 rounded-full border-none",
                    isPast
                      ? "bg-tracker-text-muted text-white"
                      : "bg-tracker-border text-tracker-text-muted",
                    isCurrent && "text-white"
                  )}
                  style={
                    isCurrent
                      ? { background: STAGE_COLORS[s] ?? "#002B49" }
                      : undefined
                  }
                >
                  {idx + 1}
                </Button>
                {idx < STAGE_ORDER.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 min-w-2 flex-1",
                      isPast ? "bg-tracker-text-muted" : "bg-tracker-border"
                    )}
                  />
                )}
              </Fragment>
            )
          })}
          <div className="w-4" />
          {/* Perdido button */}
          <Button
            size="icon-xs"
            title="Perdido"
            onClick={() => handleStageChange("Perdido")}
            disabled={deal.stage === "Perdido"}
            className={cn(
              "size-7 rounded-full border border-[#FCA5A5]",
              deal.stage === "Perdido"
                ? "bg-tracker-danger text-white"
                : "bg-red-50 text-tracker-danger"
            )}
          >
            ×
          </Button>
        </div>

        {/* Labels */}
        <div className="flex items-center">
          {STAGE_ORDER.map((s, idx) => (
            <Fragment key={s}>
              <span
                className={cn(
                  "w-7 shrink-0 overflow-hidden text-center text-[9px] leading-[1.2]",
                  idx === currentIdx
                    ? "font-bold text-tracker-blue"
                    : "text-tracker-text-muted"
                )}
              >
                {s.slice(0, 4)}
              </span>
              {idx < STAGE_ORDER.length - 1 && (
                <div className="min-w-2 flex-1" />
              )}
            </Fragment>
          ))}
        </div>

        <p className="mt-2 text-xs text-tracker-text-secondary">
          <strong className="text-tracker-blue">{deal.stage}</strong>
          {deal.amount
            ? ` · ${deal.amount.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 })}`
            : ""}
          {deal.probability !== undefined ? ` · ${deal.probability}% prob` : ""}
        </p>
      </div>

      {/* Client info — 2 cols */}
      <div className="border-b border-tracker-border px-5 py-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Información del cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={["contacts"]}>
              <AccordionItem value="contacts">
                <AccordionTrigger>Contactos</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {client?.contacts && client.contacts.length > 0 ? (
                    client.contacts.map((c) => (
                      <div key={c.id}>
                        <p className="text-xs font-semibold text-slate-700">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-tracker-text-muted">
                          {c.role}
                          {c.isDecisionMaker ? " · Principal" : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-tracker-text-muted">
                      Sin contactos
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pain">
                <AccordionTrigger>Dolor / necesidad</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-slate-700">
                    {client?.pain ?? deal.painPoint ?? "-"}
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="provider">
                <AccordionTrigger>Proveedor actual</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-slate-700">
                    {client?.provider ?? "-"}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <div className="flex-1 px-5 py-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Historial comercial</CardTitle>
          </CardHeader>
          <CardContent>
            {clientActivities.length === 0 ? (
              <p className="text-xs text-tracker-text-muted">
                Sin actividades registradas
              </p>
            ) : (
              <div className="relative">
                <div className="absolute top-2 bottom-2 left-[9px] w-0.5 bg-tracker-border" />
                <div className="flex flex-col gap-4">
                  {clientActivities.map((activity) => (
                    <div key={activity.id} className="relative flex gap-4">
                      <div
                        className={cn(
                          "z-[1] mt-0.5 size-5 shrink-0 rounded-full border-2 border-white",
                          activity.status === "Completada"
                            ? "bg-tracker-green"
                            : activity.status === "Cancelada"
                              ? "bg-tracker-text-muted"
                              : "bg-tracker-border"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-start justify-between">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="navy">{activity.type}</Badge>
                            {activity.stage && (
                              <Badge variant="gray">{activity.stage}</Badge>
                            )}
                          </div>
                          <span className="ml-2 shrink-0 text-[11px] text-tracker-text-muted">
                            {new Date(activity.executedAt).toLocaleDateString(
                              "es-MX",
                              { day: "2-digit", month: "2-digit" }
                            )}
                          </span>
                        </div>
                        {activity.summary && (
                          <div className="mb-1">
                            <p className="text-xs leading-[1.4] text-slate-700">
                              {activity.summary.length > 120 &&
                              !expandedIds.has(activity.id)
                                ? activity.summary.slice(0, 120) + "..."
                                : activity.summary}
                            </p>
                            {activity.summary.length > 120 && (
                              <Button
                                variant="link"
                                size="xs"
                                className="h-auto px-0 py-0 text-[10px] text-[#64748B]"
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
                          <p className="text-[11px] font-semibold text-tracker-green">
                            → {activity.nextStep}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-[10px] text-tracker-text-muted">
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
                                    <HugeiconsIcon
                                      icon={MoreHorizontalCircle01Icon}
                                      strokeWidth={2}
                                    />
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                Acciones de actividad
                              </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent
                              align="end"
                              className="min-w-44"
                            >
                              <DropdownMenuItem
                                onSelect={() =>
                                  setSelectedActivityId(activity.id)
                                }
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
          </CardContent>
        </Card>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-tracker-border bg-white px-5 py-4">
        <Button
          variant="success"
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
