import { useState } from "react"
import { useSearch } from "@tanstack/react-router"
import { toast } from "sonner"
import {
  BuildingIcon,
  UserIcon,
  ChecklistIcon,
  MoreHorizontalIcon,
} from "@/shared/components/Icon"
import { useDailyActivities } from "../../application/hooks/useDailyActivities"
import { useCreateActivity } from "../../application/hooks/useCreateActivity"
import { ActivityForm } from "../components/ActivityForm"
import { ActivityHistoryModal } from "../components/ActivityHistoryModal"
import { Badge, type BadgeVariant } from "@/components/ui/badge"
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
import type { CreateActivityInput } from "../../domain/activities.types"

const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  Completada: "green",
  "En curso": "blue",
  Cancelada: "gray",
  Pendiente: "yellow",
}

function getPointsBarColor(pct: number): string {
  if (pct >= 100) return "#82bc00"
  if (pct >= 50) return "#F59E0B"
  return "#EF4444"
}

export function ActivitiesPage() {
  const search = useSearch({ strict: false })
  const clientId = (search as { clientId?: string }).clientId
  const clientName = (search as { clientName?: string }).clientName
  const taskTitle = (search as { taskTitle?: string }).taskTitle
  const taskId = (search as { taskId?: string }).taskId
  const [showForm, setShowForm] = useState(() => !!(clientId || taskId))
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  )
  const { data, isLoading } = useDailyActivities()
  const {
    mutate,
    isPending,
    error: createError,
    reset: resetCreate,
  } = useCreateActivity()

  function handleSubmit(input: CreateActivityInput) {
    mutate(input, {
      onSuccess: () => {
        setShowForm(false)
        toast.success("Actividad registrada")
      },
      onError: () => toast.error("No se pudo registrar la actividad"),
    })
  }

  const totalPoints = data?.totalPoints ?? 0
  const activities = data?.activities ?? []
  const pct = Math.min(100, (totalPoints / 30) * 100)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-tracker-blue">
            Actividades del día
          </h1>
          <span className="rounded-full bg-[#EEFAD4] px-3 py-1 text-xs font-bold text-tracker-success-dark">
            {totalPoints} / 30 pts
          </span>
        </div>
        <div className="flex gap-2">
          {showForm && (
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          )}
          <Button
            onClick={() => {
              resetCreate()
              setShowForm((v) => !v)
            }}
          >
            {showForm ? "Cerrar" : "Registrar actividad"}
          </Button>
        </div>
      </div>

      {/* Points progress */}
      <div className="card p-4">
        <div className="mb-2 flex justify-between">
          <span className="kl">Progreso del día</span>
          <span className="text-xs font-semibold text-tracker-text">
            {totalPoints} / 30 pts
          </span>
        </div>
        <div className="prog">
          <div
            className="prog-fill origin-left transition-transform! duration-400!"
            style={{
              transform: `scaleX(${pct / 100})`,
              backgroundColor: getPointsBarColor(pct),
            }}
          />
        </div>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="slabel mb-4">Registrar actividad</div>
          <ActivityForm
            onSubmit={handleSubmit}
            isLoading={isPending}
            programmedTask={taskTitle}
            submitError={createError}
            initialClientId={clientId}
            initialClientLabel={clientName}
            taskId={taskId}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-[13px] text-tracker-text-muted">Cargando...</p>
      ) : activities.length === 0 ? (
        <div className="empty-state">Sin actividades registradas hoy</div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div key={activity.id} className="log-card flex items-start gap-4">
              <div className="flex min-w-16 flex-col items-center gap-1.5">
                <Badge variant="navy">{activity.type}</Badge>
                <span className="text-[11px] font-bold text-tracker-green">
                  +{activity.points} pts
                </span>
              </div>
              <div className="min-w-0 flex-1">
                {(activity.clientName ||
                  activity.contactName ||
                  activity.taskTitle) && (
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {activity.clientName && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tracker-blue">
                        <BuildingIcon color="#002B49" />
                        {activity.clientName}
                      </span>
                    )}
                    {activity.contactName && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-tracker-text-dim">
                        <UserIcon color="#64748B" />
                        {activity.contactName}
                      </span>
                    )}
                    {activity.taskTitle && (
                      <span className="inline-flex items-center gap-1 rounded bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] text-[#3730A3]">
                        <ChecklistIcon color="#4338CA" />
                        {activity.taskTitle.length > 40
                          ? activity.taskTitle.slice(0, 40) + "…"
                          : activity.taskTitle}
                      </span>
                    )}
                  </div>
                )}
                <p className="truncate text-[13px] text-tracker-text">
                  {activity.summary.length > 80
                    ? activity.summary.slice(0, 80) + "..."
                    : activity.summary}
                </p>
                <div className="prog mt-2 max-w-[120px]">
                  <div
                    className="prog-fill origin-left transition-transform! duration-400!"
                    style={{
                      transform: `scaleX(${Math.min(activity.quality, 100) / 100})`,
                      backgroundColor: getPointsBarColor(activity.quality),
                    }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-tracker-text-muted">
                  Calidad: {activity.quality}%
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge
                  variant={
                    STATUS_BADGE_VARIANTS[activity.status ?? "Pendiente"] ??
                    "yellow"
                  }
                >
                  {activity.status ?? "Pendiente"}
                </Badge>
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
                      Ver historial
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
      <ActivityHistoryModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </div>
  )
}
