import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useActivityById,
  useUpdateActivityStatus,
} from "../../application/hooks/useActivityHistory"
import { toast } from "sonner"
import { Badge, type BadgeVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  activityId: string | null
  onClose: () => void
}

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  Pendiente: "yellow",
  "En curso": "blue",
  Completada: "green",
  Cancelada: "gray",
}

const NEXT_TRANSITIONS: Record<string, string[]> = {
  Pendiente: ["En curso", "Cancelada"],
  "En curso": ["Completada", "Cancelada"],
}

const TRANSITION_LABELS: Record<string, string> = {
  "En curso": "Avanzar a En curso",
  Completada: "Avanzar a Completada",
  Cancelada: "Cancelar actividad",
}

export function ActivityHistoryModal({ activityId, onClose }: Props) {
  const { data: activity, isLoading } = useActivityById(activityId)
  const { mutate, isPending } = useUpdateActivityStatus(activityId ?? "")

  const currentStatus = activity?.status ?? "Pendiente"
  const nextTransitions = NEXT_TRANSITIONS[currentStatus] ?? []

  function handleTransition(newStatus: string) {
    if (!activityId) return
    mutate(
      { newStatus },
      {
        onSuccess: () => toast.success(`Actividad movida a "${newStatus}"`),
        onError: () => toast.error("No se pudo actualizar el estado"),
      }
    )
  }

  return (
    <Dialog
      open={!!activityId}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] w-[min(calc(100vw-2rem),760px)] max-w-none overflow-y-auto sm:max-w-none">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Cargando..." : `${activity?.type ?? ""} — Historial`}
          </DialogTitle>
          <DialogDescription>
            Consulta cambios de estado y actualiza la actividad seleccionada.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <p className="text-[13px] text-tracker-text-muted">
            Cargando actividad...
          </p>
        )}

        {activity && (
          <div className="space-y-4">
            <Card size="sm">
              <CardContent className="space-y-3">
                <div>
                  <p className="kl mb-1">Estado actual</p>
                  <Badge variant={STATUS_VARIANTS[currentStatus] ?? "gray"}>
                    {currentStatus}
                  </Badge>
                </div>

                {nextTransitions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {nextTransitions.map((next) => (
                      <Button
                        key={next}
                        variant={next === "Cancelada" ? "ghost" : "default"}
                        disabled={isPending}
                        onClick={() => handleTransition(next)}
                      >
                        {TRANSITION_LABELS[next] ?? next}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Accordion
              type="single"
              collapsible
              defaultValue={
                activity.activityHistory?.length ? "history" : undefined
              }
            >
              <AccordionItem value="history">
                <AccordionTrigger>
                  Historial de cambios ({activity.activityHistory?.length ?? 0})
                </AccordionTrigger>
                <AccordionContent>
                  {!activity.activityHistory ||
                  activity.activityHistory.length === 0 ? (
                    <p className="text-[13px] text-tracker-text-muted">
                      Sin actualizaciones aún
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {activity.activityHistory.map((entry, i) => (
                        <li key={i} className="text-xs text-tracker-text">
                          <span className="text-tracker-text-muted">
                            {new Date(entry.changedAt).toLocaleString("es-MX", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>{" "}
                          <Badge
                            variant={STATUS_VARIANTS[entry.oldStatus] ?? "gray"}
                          >
                            {entry.oldStatus}
                          </Badge>
                          {" → "}
                          <Badge
                            variant={STATUS_VARIANTS[entry.newStatus] ?? "gray"}
                          >
                            {entry.newStatus}
                          </Badge>{" "}
                          <span className="text-tracker-text-secondary">
                            por: {entry.changedBy}
                          </span>
                          {entry.comment && (
                            <span className="text-tracker-text-secondary">
                              {" "}
                              — {entry.comment}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
