import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useActivityById,
  useUpdateActivityStatus,
} from "../../application/hooks/useActivityHistory"
import { toast } from "sonner"

interface Props {
  activityId: string | null
  onClose: () => void
}

const STATUS_CLASSES: Record<string, string> = {
  Pendiente: "tag tag-yellow",
  "En curso": "tag tag-blue",
  Completada: "tag tag-green",
  Cancelada: "tag",
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Cargando..." : `${activity?.type ?? ""} — Historial`}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <p style={{ fontSize: 13, color: "#94A3B8" }}>
            Cargando actividad...
          </p>
        )}

        {activity && (
          <div className="space-y-4">
            <div>
              <p className="kl mb-1">Estado actual</p>
              <span className={STATUS_CLASSES[currentStatus] ?? "tag"}>
                {currentStatus}
              </span>
            </div>

            {nextTransitions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextTransitions.map((next) => (
                  <button
                    key={next}
                    className={
                      next === "Cancelada" ? "btn-ghost" : "btn-primary"
                    }
                    disabled={isPending}
                    onClick={() => handleTransition(next)}
                  >
                    {TRANSITION_LABELS[next] ?? next}
                  </button>
                ))}
              </div>
            )}

            <div>
              <p className="kl mb-2">Historial de cambios</p>
              {!activity.activityHistory ||
              activity.activityHistory.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94A3B8" }}>
                  Sin actualizaciones aún
                </p>
              ) : (
                <ul className="space-y-2">
                  {activity.activityHistory.map((entry, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#0F172A" }}>
                      <span style={{ color: "#94A3B8" }}>
                        {new Date(entry.changedAt).toLocaleString("es-MX", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>{" "}
                      <span
                        className={STATUS_CLASSES[entry.oldStatus] ?? "tag"}
                      >
                        {entry.oldStatus}
                      </span>
                      {" → "}
                      <span
                        className={STATUS_CLASSES[entry.newStatus] ?? "tag"}
                      >
                        {entry.newStatus}
                      </span>{" "}
                      <span style={{ color: "#64748B" }}>
                        por: {entry.changedBy}
                      </span>
                      {entry.comment && (
                        <span style={{ color: "#64748B" }}>
                          {" "}
                          — {entry.comment}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
