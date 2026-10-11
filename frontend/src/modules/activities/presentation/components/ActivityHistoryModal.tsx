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
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/shared/components/data/StatusBadge"

interface Props {
  activityId: string | null
  onClose: () => void
  onReturnFocus?: () => void
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

export function ActivityHistoryModal({ activityId, onClose, onReturnFocus }: Props) {
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
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-y-auto bg-background p-0 sm:max-w-2xl"
        onCloseAutoFocus={(event) => {
          if (onReturnFocus) {
            event.preventDefault()
            onReturnFocus()
          }
        }}
      >
        <DialogHeader className="border-b p-4 md:p-6">
          <DialogTitle>
            {isLoading ? "Cargando..." : `${activity?.type ?? ""} — Historial`}
          </DialogTitle>
          <DialogDescription>
            Consulta cambios de estado y actualiza la actividad seleccionada.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div
            className="flex flex-col gap-3 p-4 md:p-6"
            role="status"
            aria-label="Cargando actividad"
          >
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {activity && (
          <div className="grid gap-px bg-border">
            <section className="bg-background p-4 md:p-6">
              <h5 className="text-base font-semibold">Estado actual</h5>
              <div className="mt-4 flex flex-col gap-4">
                <StatusBadge status={currentStatus} />

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
              </div>
            </section>

            <section className="bg-background px-4 py-2 md:px-6">
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
                      <p className="text-xs text-muted-foreground">
                        Sin actualizaciones aún
                      </p>
                    ) : (
                      <ul className="divide-y">
                        {activity.activityHistory.map((entry, i) => (
                          <li
                            key={i}
                            className="flex flex-wrap items-center gap-1.5 py-2 text-xs text-foreground"
                          >
                            <span className="text-muted-foreground tabular-nums">
                              {new Date(entry.changedAt).toLocaleString(
                                "es-MX",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }
                              )}
                            </span>
                            <StatusBadge status={entry.oldStatus} />
                            <span aria-hidden="true">→</span>
                            <span className="sr-only">a</span>
                            <StatusBadge status={entry.newStatus} />
                            <span className="text-muted-foreground">
                              por: {entry.changedBy}
                            </span>
                            {entry.comment && (
                              <span className="text-muted-foreground">
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
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
