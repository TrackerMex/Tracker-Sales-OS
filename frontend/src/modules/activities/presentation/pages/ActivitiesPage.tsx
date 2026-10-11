import { useState } from "react"
import { useSearch } from "@tanstack/react-router"
import { toast } from "sonner"
import {
  BarChartIcon,
  BuildingIcon,
  UserIcon,
  ChecklistIcon,
  MoreHorizontalIcon,
  PulseIcon,
} from "@/shared/components/Icon"
import { DAILY_MIN_POINTS } from "@/shared/lib/constants"
import { STATUS_FILL_CLASS, type StatusTone } from "@/shared/lib/status"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { StatCard } from "@/shared/components/data/StatCard"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDailyActivities } from "../../application/hooks/useDailyActivities"
import { useCreateActivity } from "../../application/hooks/useCreateActivity"
import { ActivityForm } from "../components/ActivityForm"
import { ActivityHistoryModal } from "../components/ActivityHistoryModal"
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
import type { CreateActivityInput } from "../../domain/activities.types"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"

function getPointsTone(pct: number): StatusTone {
  if (pct >= 100) return "success"
  if (pct >= 50) return "pending"
  return "danger"
}

export function ActivitiesPage() {
  const search = useSearch({ strict: false })
  const clientId = (search as { clientId?: string }).clientId
  const clientName = (search as { clientName?: string }).clientName
  const taskTitle = (search as { taskTitle?: string }).taskTitle
  const taskId = (search as { taskId?: string }).taskId
  const sellerId = (search as { sellerId?: string }).sellerId
  const currentUser = useAppStore((s) => s.currentUser)
  const isManager = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Director
  const [selectedSellerId, setSelectedSellerId] = useState(sellerId ?? "")
  const [showForm, setShowForm] = useState(() => !!(clientId || taskId))
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  )
  const { data, isLoading } = useDailyActivities(undefined, isManager ? selectedSellerId || null : undefined)
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
  const pct = Math.min(100, (totalPoints / DAILY_MIN_POINTS) * 100)

  return (
    <div>
      <PageHeader
        title="Registrar actividad"
        description="Actividades del día"
        actions={
          <>
            <StatusBadge
              tone={totalPoints >= DAILY_MIN_POINTS ? "success" : "neutral"}
              className="px-3 py-1 font-medium"
            >
              {totalPoints} / {DAILY_MIN_POINTS} pts
            </StatusBadge>
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
          </>
        }
      />

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <StatCard
          className="col-span-12"
          label="Progreso del día"
          icon={<BarChartIcon size={16} />}
          value={
            <>
              {totalPoints}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {DAILY_MIN_POINTS} pts
              </span>
            </>
          }
          description="Meta de actividad mínima"
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn(
                "h-full w-full origin-left rounded-full transition-transform duration-400 motion-reduce:transition-none",
                STATUS_FILL_CLASS[getPointsTone(pct)]
              )}
              style={{ transform: `scaleX(${pct / 100})` }}
            />
          </div>
        </StatCard>

        {showForm && (
          <div className="col-span-12">
            <ActivityForm
              onSubmit={handleSubmit}
              isLoading={isPending}
              programmedTask={taskTitle}
              submitError={createError}
              initialClientId={clientId}
              initialClientLabel={clientName}
              taskId={taskId}
              initialSellerId={selectedSellerId}
              onSellerChange={setSelectedSellerId}
            />
          </div>
        )}

        <SectionCard title="Actividades de hoy" icon={<PulseIcon size={16} />}>
          {isLoading ? (
            <div
              className="flex flex-col gap-3 p-4"
              role="status"
              aria-label="Cargando actividades"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={<PulseIcon size={20} />}
              title="Sin actividades registradas hoy"
            />
          ) : (
            <ul className="divide-y">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-start gap-4 p-4">
                  <div className="flex min-w-16 flex-col items-center gap-1.5">
                    <Badge variant="outline">{activity.type}</Badge>
                    <span className="text-xs font-medium text-foreground tabular-nums">
                      +{activity.points} pts
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {(activity.clientName ||
                      activity.contactName ||
                      activity.taskTitle) && (
                      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {activity.clientName && (
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <BuildingIcon
                              size={14}
                              className="text-muted-foreground"
                            />
                            {activity.clientName}
                          </span>
                        )}
                        {activity.contactName && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <UserIcon size={14} />
                            {activity.contactName}
                          </span>
                        )}
                        {activity.taskTitle && (
                          <Badge variant="secondary">
                            <ChecklistIcon />
                            {activity.taskTitle.length > 40
                              ? activity.taskTitle.slice(0, 40) + "…"
                              : activity.taskTitle}
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="truncate text-sm text-foreground">
                      {activity.summary.length > 80
                        ? activity.summary.slice(0, 80) + "..."
                        : activity.summary}
                    </p>
                    <div className="mt-2 h-1.5 max-w-[120px] overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className={cn(
                          "h-full w-full origin-left rounded-full transition-transform duration-400 motion-reduce:transition-none",
                          STATUS_FILL_CLASS[getPointsTone(activity.quality)]
                        )}
                        style={{
                          transform: `scaleX(${Math.min(activity.quality, 100) / 100})`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Calidad: {activity.quality}%
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={activity.status ?? "Pendiente"} />
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
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <ActivityHistoryModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </div>
  )
}
