import { useState, type ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMiDia } from "../../application/hooks/useMiDia"
import { useTodayTasks } from "../../../tasks/application/hooks/useTodayTasks"
import { useCompleteTask } from "../../../tasks/application/hooks/useCompleteTask"
import { TYPE_TAG } from "../../../tasks/presentation/components/TaskCard"
import type { Task } from "../../../tasks/domain/tasks.types"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { DottedDivider } from "@/shared/components/layout/DottedDivider"
import { StatCard } from "@/shared/components/data/StatCard"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import { EmptyState } from "@/shared/components/data/EmptyState"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BarChartIcon,
  BuildingIcon,
  CalendarIcon,
  ChecklistIcon,
  DocumentTextIcon,
  PlusIcon,
  PulseIcon,
  UserIcon,
  UsersIcon,
} from "@/shared/components/Icon"
import {
  STATUS_FILL_CLASS,
  STATUS_TILE_CLASS,
  type StatusTone,
} from "@/shared/lib/status"
import { cn } from "@/lib/utils"

type Semaphore = "verde" | "ambar" | "rojo" | "morado"
type AlertVariant = "danger" | "warning" | "purple" | "success"

const SEMAPHORE: Record<
  Semaphore,
  { label: string; rule: string; desc: string }
> = {
  verde: {
    label: "Todo OK",
    rule: "Mantén el ritmo. Registra cada actividad en tiempo real.",
    desc: "Llevas buen ritmo de llamadas, agenda y esfuerzo. Mantén calidad en notas y asegura que cada compromiso tenga siguiente paso.",
  },
  ambar: {
    label: "Atención",
    rule: "Registra actividad en tiempo real, no al cierre del día.",
    desc: "Llamadas, visitas y propuestas requieren siguiente paso. Chat y correo no lo requieren salvo que exista compromiso.",
  },
  rojo: {
    label: "Urgente",
    rule: "Atiende primero lo vencido.",
    desc: "Tienes seguimientos vencidos o puntos muy por debajo del mínimo. Prioriza llamadas y cierra los pendientes antes de sumar nuevos.",
  },
  morado: {
    label: "Coach",
    rule: "Sesión de coaching sugerida.",
    desc: "Tu patrón de actividad indica que necesitas apoyo del líder. Agenda una sesión antes de continuar.",
  },
}

const ALERT_TONE: Record<AlertVariant, StatusTone> = {
  danger: "danger",
  warning: "pending",
  purple: "progress",
  success: "success",
}

// Same thresholds as before (goal met, at least half, below half), shown as a
// progress badge instead of coloring the number.
function metricBadge(
  current: number,
  goal: number
): { label: string; tone: StatusTone } | undefined {
  if (goal === 0) return undefined
  const pct = current / goal
  const tone: StatusTone =
    pct >= 1 ? "success" : pct >= 0.5 ? "pending" : "danger"
  return { label: `${Math.round(pct * 100)}%`, tone }
}

function formatTime(scheduledAt: string | null | undefined): string {
  if (!scheduledAt) return ""
  const d = new Date(scheduledAt)
  if (isNaN(d.getTime())) return scheduledAt
  const today = new Date()
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (isToday) {
    return d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })
}

// KPI row of the bento: 3 + 2 per row on xl, 2 per row on md, stacked on mobile.
const KPI_SPANS = [
  "col-span-12 md:col-span-6 xl:col-span-4",
  "col-span-12 md:col-span-6 xl:col-span-4",
  "col-span-12 md:col-span-6 xl:col-span-4",
  "col-span-12 md:col-span-6",
  "col-span-12 xl:col-span-6",
]

function Ratio({ value, goal }: { value: number; goal: ReactNode }) {
  return (
    <>
      {value}
      <span className="text-base font-normal text-muted-foreground">
        {goal}
      </span>
    </>
  )
}

function MiDiaSkeleton() {
  return (
    <div>
      <PageHeader title="Mi día" />
      <div
        className="grid grid-cols-12 gap-px bg-border p-px"
        role="status"
        aria-label="Cargando Mi día"
      >
        {KPI_SPANS.map((span, i) => (
          <div
            key={i}
            className={cn(span, "flex flex-col gap-3 bg-background p-6")}
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-5 w-36" />
          </div>
        ))}
        <DottedDivider />
        <div className="col-span-12 flex flex-col gap-2 bg-background p-4 lg:col-span-7">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="col-span-12 flex flex-col gap-2 bg-background p-4 lg:col-span-5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  )
}

function SellerPicker({
  onSelect,
}: {
  onSelect: (id: string, name: string) => void
}) {
  const { data: sellers, isLoading, isError, refetch } = useSellers()
  const active = (sellers ?? []).filter((s) => s.active)

  return (
    <div>
      <PageHeader
        title="Mi día"
        description="Selecciona un vendedor para ver su estado operativo del día."
      />
      {isLoading ? (
        <div
          className="grid gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="status"
          aria-label="Cargando vendedores"
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 bg-background p-6">
              <Skeleton className="size-10" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="border border-border bg-background">
          <EmptyState
            icon={<AlertCircleIcon size={20} />}
            title="No se pudo cargar la lista de vendedores."
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Reintentar
              </Button>
            }
          />
        </div>
      ) : active.length === 0 ? (
        <div className="border border-border bg-background">
          <EmptyState
            icon={<UsersIcon size={20} />}
            title="Sin vendedores activos."
          />
        </div>
      ) : (
        <div className="grid border-t border-l border-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {active.map((s) => (
            <button
              key={s.id}
              type="button"
              className="group flex min-w-0 items-center gap-3 border-r border-b border-border bg-background p-6 text-left transition-colors outline-none hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              onClick={() => onSelect(s.id, s.name)}
            >
              <span className="shrink-0 rounded-md border border-border p-2.5 text-foreground">
                <UserIcon size={16} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className="truncate text-sm font-medium text-foreground"
                  title={s.name}
                >
                  {s.name}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {s.profile ?? "Ejecutivo comercial"}
                </span>
              </span>
              <ArrowRightIcon
                size={16}
                className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MiDiaPage() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdminOrDirector =
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Director
  const [selectedSeller, setSelectedSeller] = useState<{
    id: string
    name: string
  } | null>(null)

  const activeSellerId = isAdminOrDirector
    ? (selectedSeller?.id ?? null)
    : (currentUser?.sellerId ?? null)

  const { data, isLoading, isError, refetch } = useMiDia(activeSellerId)
  const { data: tasks, isError: tasksError } = useTodayTasks(activeSellerId)
  const {
    mutate: completeTask,
    isPending: isCompleting,
    variables: completingTaskId,
  } = useCompleteTask()

  if (isAdminOrDirector && !selectedSeller) {
    return (
      <SellerPicker onSelect={(id, name) => setSelectedSeller({ id, name })} />
    )
  }

  if (!isAdminOrDirector && !currentUser?.sellerId) {
    return (
      <div>
        <PageHeader title="Mi día" />
        <div className="border border-border bg-background">
          <EmptyState
            icon={<UserIcon size={20} />}
            title="Tu cuenta no tiene perfil de vendedor asociado."
          />
        </div>
      </div>
    )
  }

  if (isLoading) return <MiDiaSkeleton />

  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Mi día" />
        <div className="border border-border bg-background">
          <EmptyState
            icon={<AlertCircleIcon size={20} />}
            title="No se pudo cargar los datos de Mi Día."
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Reintentar
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  function handleCompleteTask(task: Task) {
    completeTask(task.id, {
      onSuccess: (completedTask) => {
        toast.success("Tarea completada")
        const clientId = completedTask.clientId ?? task.clientId
        const clientName = completedTask.clientName?.trim() || task.clientName
        void navigate({
          to: "/actividades/nueva",
          search: {
            ...(clientId
              ? { clientId }
              : {}),
            ...(clientName
              ? { clientName }
              : {}),
            ...(task.title ? { taskTitle: task.title } : {}),
            taskId: task.id,
            sellerId: completedTask.sellerId,
          },
        })
      },
      onError: () => toast.error("No se pudo completar la tarea"),
    })
  }

  const taskList = tasks ?? []
  const pendingCount = taskList.filter((t) => t.status === "Pendiente").length
  const completedCount = taskList.filter(
    (t) => t.status === "Completado"
  ).length
  const semaphKey: Semaphore = SEMAPHORE[data.semaphore]
    ? data.semaphore
    : "ambar"
  const semaph = SEMAPHORE[semaphKey]
  const ptsPct =
    data.dailyPointsGoal > 0
      ? Math.min(
          100,
          Math.round((data.pointsToday / data.dailyPointsGoal) * 100)
        )
      : 100

  const alerts: Array<{ variant: AlertVariant; text: string }> = []
  if (data.overdueCount > 0)
    alerts.push({
      variant: "danger",
      text: `${data.overdueCount} seguimiento${data.overdueCount !== 1 ? "s" : ""} vencido${data.overdueCount !== 1 ? "s" : ""}. Atiende lo vencido primero.`,
    })
  if (data.pointsToday < data.dailyPointsGoal)
    alerts.push({
      variant: "warning",
      text: `Vas en ${data.pointsToday}/${data.dailyPointsGoal} puntos. Te faltan ${data.dailyPointsGoal - data.pointsToday} para el mínimo.`,
    })
  if (data.callsToday < data.dailyCallsGoal)
    alerts.push({
      variant: "warning",
      text: `Llevas ${data.callsToday}/${data.dailyCallsGoal} llamadas. ${data.dailyCallsGoal - data.callsToday} más para cumplir el objetivo.`,
    })
  if (data.tomorrowTasksCount < data.tomorrowTasksGoal)
    alerts.push({
      variant: "danger",
      text: `Agenda de mañana baja (${data.tomorrowTasksCount}/${data.tomorrowTasksGoal}). Programa actividades antes de cerrar el día.`,
    })
  if (data.newProspectsToday < data.newProspectsGoal)
    alerts.push({
      variant: "purple",
      text: `Prospectos nuevos hoy: ${data.newProspectsToday}/${data.newProspectsGoal}. Alimenta pipeline si la agenda está baja.`,
    })
  if (data.coldAccountsCount > 0)
    alerts.push({
      variant: "warning",
      text: `${data.coldAccountsCount} cuenta${data.coldAccountsCount !== 1 ? "s" : ""} fría${data.coldAccountsCount !== 1 ? "s" : ""} asignada${data.coldAccountsCount !== 1 ? "s" : ""}. Reactiva antes de fin de semana.`,
    })
  if (alerts.length === 0)
    alerts.push({
      variant: "success",
      text: "Buen ritmo: tienes puntos, llamadas, agenda futura y pipeline activo. Mantén calidad en notas.",
    })

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const hasTips = data.coachTips.length > 0

  return (
    <div>
      <PageHeader
        title="Mi día"
        description={`${data.sellerName} · ${today}`}
        actions={
          isAdminOrDirector &&
          selectedSeller && (
            <Button
              variant="outline"
              onClick={() => setSelectedSeller(null)}
              aria-label={`Cambiar vendedor (actualmente: ${selectedSeller.name})`}
            >
              <UsersIcon size={16} />
              Cambiar vendedor
            </Button>
          )
        }
      />

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <StatCard
          className={KPI_SPANS[0]}
          label="Puntos de hoy"
          icon={<BarChartIcon size={16} />}
          value={
            <Ratio value={data.pointsToday} goal={`/${data.dailyPointsGoal}`} />
          }
          description="Meta de actividad mínima"
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-400 motion-reduce:transition-none"
              style={{ transform: `scaleX(${ptsPct / 100})` }}
            />
          </div>
        </StatCard>
        <StatCard
          className={KPI_SPANS[1]}
          label="Llamadas hoy"
          icon={<UserIcon size={16} />}
          value={
            <Ratio value={data.callsToday} goal={`/${data.dailyCallsGoal}`} />
          }
          badge={metricBadge(data.callsToday, data.dailyCallsGoal)}
          description="Objetivo recomendado"
        />
        <StatCard
          className={KPI_SPANS[2]}
          label="Agenda mañana"
          icon={<CalendarIcon size={16} />}
          value={
            <Ratio
              value={data.tomorrowTasksCount}
              goal={` meta: ${data.tomorrowTasksGoal}`}
            />
          }
          badge={metricBadge(data.tomorrowTasksCount, data.tomorrowTasksGoal)}
          description="Planeación mínima"
        />
        <StatCard
          className={KPI_SPANS[3]}
          label="Prospectos hoy"
          icon={<UsersIcon size={16} />}
          value={
            <Ratio
              value={data.newProspectsToday}
              goal={`/${data.newProspectsGoal}`}
            />
          }
          badge={metricBadge(data.newProspectsToday, data.newProspectsGoal)}
          description="Alimenta pipeline si vas bajo"
        />
        <StatCard
          className={KPI_SPANS[4]}
          label="Tareas hoy"
          icon={<ChecklistIcon size={16} />}
          value={<Ratio value={completedCount} goal={`/${taskList.length}`} />}
          badge={metricBadge(completedCount, taskList.length)}
          description={`${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`}
        />

        <DottedDivider />

        <SectionCard
          title="Termómetro operativo"
          icon={<AlertCircleIcon size={16} />}
          className="lg:col-span-7"
        >
          <ul className="flex flex-col gap-2 p-4">
            {alerts.map((a, i) => {
              const tone = ALERT_TONE[a.variant]
              return (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-2.5 rounded-md border px-3 py-2 text-sm",
                    STATUS_TILE_CLASS[tone],
                    "text-foreground"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      STATUS_FILL_CLASS[tone]
                    )}
                  />
                  {a.text}
                </li>
              )
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Regla del día"
          icon={<DocumentTextIcon size={16} />}
          className="lg:col-span-5"
        >
          <div className="flex flex-col gap-3 p-4">
            <StatusBadge status={semaphKey}>{semaph.label}</StatusBadge>
            <p className="text-sm font-medium text-foreground">{semaph.rule}</p>
            <p className="text-sm text-muted-foreground">{semaph.desc}</p>
            <div className="mt-1 flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => void navigate({ to: "/agenda" })}
              >
                <PlusIcon size={16} />
                Crear tarea
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void navigate({ to: "/clientes" })}
              >
                <PlusIcon size={16} />
                Nuevo prospecto
              </Button>
            </div>
          </div>
        </SectionCard>

        <DottedDivider />

        <SectionCard
          title="Agenda de hoy y pendientes"
          icon={<ChecklistIcon size={16} />}
          className={hasTips ? "lg:col-span-7" : undefined}
        >
          {tasksError ? (
            <EmptyState
              icon={<AlertCircleIcon size={20} />}
              title="No se pudo cargar la agenda."
            />
          ) : taskList.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon size={20} />}
              title="Sin tareas abiertas"
              description="Crea agenda para mañana antes de cerrar el día."
              action={
                <Button
                  variant="outline"
                  onClick={() => void navigate({ to: "/agenda" })}
                >
                  <PlusIcon size={16} />
                  Crear tarea
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col">
              {taskList.map((task) => {
                const isOverdue = task.isOverdue && task.status === "Pendiente"
                const isCompleted = task.status === "Completado"
                const isThisTaskPending =
                  isCompleting && completingTaskId === task.id
                const clientName = task.clientName ?? null
                const contactName = task.contactName ?? null
                const typeTagVariant = task.type
                  ? (TYPE_TAG[task.type] ?? "gray")
                  : null
                return (
                  <li
                    key={task.id}
                    className={cn(
                      "flex items-start justify-between gap-3 border-b border-border px-4 py-3 last:border-0",
                      isOverdue && "bg-destructive/5",
                      isCompleted && "opacity-60"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isOverdue
                              ? "text-status-danger"
                              : "text-foreground",
                            isCompleted && "line-through"
                          )}
                        >
                          {task.title}
                        </p>
                        {isOverdue && <StatusBadge status="Vencida" />}
                      </div>
                      {(clientName || contactName || typeTagVariant) && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {clientName && (
                            <span className="inline-flex items-center gap-1 text-sm text-foreground">
                              <BuildingIcon
                                size={14}
                                className="text-muted-foreground"
                              />
                              {clientName}
                            </span>
                          )}
                          {contactName && (
                            <span className="inline-flex items-center gap-1 text-sm text-foreground">
                              <UserIcon
                                size={14}
                                className="text-muted-foreground"
                              />
                              {contactName}
                            </span>
                          )}
                          {typeTagVariant && (
                            <Badge variant={typeTagVariant} className="gap-1">
                              <ChecklistIcon size={12} />
                              {task.type}
                            </Badge>
                          )}
                        </div>
                      )}
                      {task.scheduledAt && (
                        <p
                          className={cn(
                            "text-xs font-medium",
                            isOverdue
                              ? "text-status-danger"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatTime(task.scheduledAt)}
                        </p>
                      )}
                    </div>
                    {task.status === "Pendiente" && !isAdminOrDirector && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            disabled={isThisTaskPending}
                            aria-label={`Completar: ${task.title}`}
                            aria-busy={isThisTaskPending}
                          >
                            {isThisTaskPending ? "..." : "Completar"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Completar esta tarea?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Se marcará como completada y se abrirá el registro
                              de actividad. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCompleteTask(task)}
                            >
                              Sí, completar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>

        {hasTips && (
          <SectionCard
            title="Coach IA"
            icon={<PulseIcon size={16} />}
            className="lg:col-span-5"
          >
            <ul className="flex list-disc flex-col gap-1.5 py-4 pr-4 pl-8 text-sm text-foreground">
              {data.coachTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
