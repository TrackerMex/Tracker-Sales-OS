import { useState } from "react"
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
import { Badge, type BadgeVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useMiDia } from "../../application/hooks/useMiDia"
import { useTodayTasks } from "../../../tasks/application/hooks/useTodayTasks"
import { useCompleteTask } from "../../../tasks/application/hooks/useCompleteTask"
import { TYPE_TAG } from "../../../tasks/presentation/components/TaskCard"
import type { Task } from "../../../tasks/domain/tasks.types"
import {
  BuildingIcon,
  UserIcon,
  ChecklistIcon,
} from "@/shared/components/Icon"
import { cn } from "@/lib/utils"

type Semaphore = "verde" | "ambar" | "rojo" | "morado"
type AlertVariant = "danger" | "warning" | "purple" | "success"

const SEMAPHORE: Record<
  Semaphore,
  { tag: BadgeVariant; label: string; rule: string; desc: string }
> = {
  verde: {
    tag: "green",
    label: "Todo OK",
    rule: "Mantén el ritmo. Registra cada actividad en tiempo real.",
    desc: "Llevas buen ritmo de llamadas, agenda y esfuerzo. Mantén calidad en notas y asegura que cada compromiso tenga siguiente paso.",
  },
  ambar: {
    tag: "amber",
    label: "Atención",
    rule: "Registra actividad en tiempo real, no al cierre del día.",
    desc: "Llamadas, visitas y propuestas requieren siguiente paso. Chat y correo no lo requieren salvo que exista compromiso.",
  },
  rojo: {
    tag: "red",
    label: "Urgente",
    rule: "Atiende primero lo vencido.",
    desc: "Tienes seguimientos vencidos o puntos muy por debajo del mínimo. Prioriza llamadas y cierra los pendientes antes de sumar nuevos.",
  },
  morado: {
    tag: "purple",
    label: "Coach",
    rule: "Sesión de coaching sugerida.",
    desc: "Tu patrón de actividad indica que necesitas apoyo del líder. Agenda una sesión antes de continuar.",
  },
}

function metricColorClass(current: number, goal: number): string {
  if (goal === 0) return "text-tracker-text"
  const pct = current / goal
  if (pct >= 1) return "text-tracker-text"
  if (pct >= 0.5) return "text-tracker-warning"
  return "text-tracker-danger"
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

function MiDiaSkeleton() {
  return (
    <div className="p-6">
      <div className="kpi-strip mb-[18px] animate-pulse motion-reduce:animate-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={i === 0 ? "kpi-cell ac" : "kpi-cell"}>
            <div
              className={cn(
                "h-[11px] w-[70px] rounded",
                i === 0 ? "bg-white/18" : "bg-tracker-border"
              )}
            />
            <div className="my-2">
              <div
                className={cn(
                  "h-[26px] w-12 rounded",
                  i === 0 ? "bg-white/25" : "bg-tracker-border"
                )}
              />
            </div>
            <div
              className={cn(
                "h-2.5 w-[90px] rounded",
                i === 0 ? "bg-white/12" : "bg-slate-100"
              )}
            />
          </div>
        ))}
      </div>
      <div className="page-grid">
        <div className="flex flex-col gap-4">
          <div className="card animate-pulse p-5 motion-reduce:animate-none">
            <div className="mb-3 h-[11px] w-[140px] rounded bg-tracker-border" />
            <div className="flex flex-col gap-2">
              {["h-12", "h-10"].map((hCls, i) => (
                <div
                  key={i}
                  className={cn("rounded-lg bg-tracker-surface-alt", hCls)}
                />
              ))}
            </div>
          </div>
          <div className="card animate-pulse p-5 motion-reduce:animate-none">
            <div className="mb-3 h-[11px] w-[170px] rounded bg-tracker-border" />
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[52px] rounded-[9px] border border-tracker-border"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="card animate-pulse self-start p-5 motion-reduce:animate-none">
          <div className="mb-3 h-[11px] w-[90px] rounded bg-tracker-border" />
          <div className="mb-3 h-5 w-[60px] rounded bg-slate-100" />
          <div className="mb-2 h-4 w-[90%] rounded bg-tracker-border" />
          <div className="flex flex-col gap-1">
            {["w-full", "w-4/5", "w-[70%]"].map((wCls, i) => (
              <div
                key={i}
                className={cn("h-[13px] rounded bg-slate-100", wCls)}
              />
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <div className="h-8 rounded-lg bg-tracker-border" />
            <div className="h-8 rounded-lg bg-tracker-border" />
          </div>
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
    <div className="p-6">
      <h1 className="page-title mb-1">Mi Día</h1>
      <p className="page-subtitle mb-[18px]">
        Selecciona un vendedor para ver su estado operativo del día.
      </p>
      {isLoading ? (
        <div className="grid animate-pulse grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 motion-reduce:animate-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] rounded-[10px] bg-slate-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="card flex items-center justify-between p-5">
          <p className="m-0 text-[13px] text-tracker-danger">
            No se pudo cargar la lista de vendedores.
          </p>
          <Button
            variant="ghost"
            className="ml-3"
            onClick={() => void refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : active.length === 0 ? (
        <div className="empty-state">Sin vendedores activos.</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {active.map((s) => (
            <button
              key={s.id}
              className="seller-pick-card"
              onClick={() => onSelect(s.id, s.name)}
            >
              <p className="spc-name" title={s.name}>
                {s.name}
              </p>
              <p className="spc-role">{s.profile ?? "Ejecutivo comercial"}</p>
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
      <div className="flex justify-center p-6 pt-14">
        <div className="card max-w-sm p-10 text-center">
          <p className="text-sm text-tracker-text-secondary">
            Tu cuenta no tiene perfil de vendedor asociado.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) return <MiDiaSkeleton />

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="card flex items-center justify-between gap-2.5 p-4">
          <p className="m-0 text-[13px] text-tracker-danger">
            No se pudo cargar los datos de Mi Día.
          </p>
          <Button
            variant="ghost"
            className="ml-3"
            onClick={() => void refetch()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  function handleCompleteTask(task: Task) {
    completeTask(task.id, {
      onSuccess: (completedTask) => {
        toast.success("Tarea completada")
        void navigate({
          to: "/actividades/nueva",
          search: {
            ...(completedTask.clientId
              ? { clientId: completedTask.clientId }
              : {}),
            ...(completedTask.clientName
              ? { clientName: completedTask.clientName }
              : {}),
            ...(task.title ? { taskTitle: task.title } : {}),
            taskId: task.id,
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
  const semaph = SEMAPHORE[data.semaphore] ?? SEMAPHORE.ambar
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

  return (
    <div className="p-6">
      {/* SELLER BANNER (admin/director only) */}
      {isAdminOrDirector && selectedSeller && (
        <div className="seller-banner">
          <span>
            Viendo Mi Día de <strong>{selectedSeller.name}</strong>
          </span>
          <Button
            variant="ghost"
            onClick={() => setSelectedSeller(null)}
            aria-label={`Cambiar vendedor (actualmente: ${selectedSeller.name})`}
          >
            Cambiar
          </Button>
        </div>
      )}

      {/* KPI STRIP */}
      <div className="kpi-strip mb-5">
        <div className="kpi-cell ac">
          <div className="kl">Puntos de hoy</div>
          <div className="kv">
            {data.pointsToday}
            <span className="kv-sub-light">/{data.dailyPointsGoal}</span>
          </div>
          <div className="ksb">
            <span>Meta de actividad mínima</span>
            <div className="prog mt-1">
              <div
                className="prog-fill w-full origin-left bg-tracker-green"
                style={{ transform: `scaleX(${ptsPct / 100})` }}
              />
            </div>
          </div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Llamadas hoy</div>
          <div
            className={cn(
              "kv",
              metricColorClass(data.callsToday, data.dailyCallsGoal)
            )}
          >
            {data.callsToday}
            <span className="kv-sub">/{data.dailyCallsGoal}</span>
          </div>
          <div className="ksb">Objetivo recomendado</div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Agenda mañana</div>
          <div
            className={cn(
              "kv",
              metricColorClass(data.tomorrowTasksCount, data.tomorrowTasksGoal)
            )}
          >
            {data.tomorrowTasksCount}
            <span className="kv-sub"> meta: {data.tomorrowTasksGoal}</span>
          </div>
          <div className="ksb">Planeación mínima</div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Prospectos hoy</div>
          <div
            className={cn(
              "kv",
              metricColorClass(data.newProspectsToday, data.newProspectsGoal)
            )}
          >
            {data.newProspectsToday}
            <span className="kv-sub">/{data.newProspectsGoal}</span>
          </div>
          <div className="ksb">Alimenta pipeline si vas bajo</div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Tareas hoy</div>
          <div
            className={cn(
              "kv",
              metricColorClass(completedCount, taskList.length)
            )}
          >
            {completedCount}
            <span className="kv-sub">/{taskList.length}</span>
          </div>
          <div className="ksb">
            <span
              className={
                pendingCount > 0
                  ? "text-tracker-warning"
                  : "text-tracker-text-secondary"
              }
            >
              {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="page-grid">
        {/* LEFT */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* THERMOMETER */}
          <div className="card p-5">
            <p className="slabel mb-3">Termómetro operativo</p>
            <div className="flex flex-col gap-2">
              {alerts.map((a, i) => (
                <div key={i} className={`thermo-alert ${a.variant}`}>
                  {a.text}
                </div>
              ))}
            </div>
          </div>

          {/* AI COACH TIPS */}
          {data.coachTips.length > 0 && (
            <div className="ai-box">
              <p className="slabel mb-2 text-tracker-purple">Coach IA</p>
              <ul className="m-0 pl-4">
                {data.coachTips.map((tip, i) => (
                  <li
                    key={i}
                    className={cn(
                      "text-[12.5px]",
                      i < data.coachTips.length - 1 && "mb-[5px]"
                    )}
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TASK LIST */}
          <div className="card p-5">
            <p className="slabel mb-3">Agenda de hoy y pendientes</p>
            <div className="flex flex-col gap-2">
              {tasksError ? (
                <div className="empty-state text-tracker-danger">
                  No se pudo cargar la agenda.
                </div>
              ) : taskList.length === 0 ? (
                <div className="empty-state">
                  Sin tareas abiertas. Crea agenda para mañana antes de cerrar
                  el día.
                </div>
              ) : (
                taskList.map((task) => {
                  const isOverdue =
                    task.isOverdue && task.status === "Pendiente"
                  const isCompleted = task.status === "Completado"
                  const isThisTaskPending =
                    isCompleting && completingTaskId === task.id
                  const cls = [
                    "task-item",
                    isOverdue ? "is-overdue" : "",
                    isCompleted ? "is-completed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                  const clientName = task.clientName ?? null
                  const contactName = task.contactName ?? null
                  const typeTagVariant = task.type
                    ? (TYPE_TAG[task.type] ?? "gray")
                    : null
                  return (
                    <div key={task.id} className={cls}>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-1.5">
                          <p className="ti-title">{task.title}</p>
                          {isOverdue && <Badge variant="red">Vencida</Badge>}
                        </div>
                        {(clientName || contactName || typeTagVariant) && (
                          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                            {clientName && (
                              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700">
                                <BuildingIcon size={12} color="#334155" />
                                {clientName}
                              </span>
                            )}
                            {contactName && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-tracker-text-secondary">
                                <UserIcon size={11} color="#64748B" />
                                {contactName}
                              </span>
                            )}
                            {typeTagVariant && (
                              <Badge
                                variant={typeTagVariant}
                                className="inline-flex items-center gap-1"
                              >
                                <ChecklistIcon size={11} />
                                {task.type}
                              </Badge>
                            )}
                          </div>
                        )}
                        {task.scheduledAt && (
                          <p className="ti-time">
                            {formatTime(task.scheduledAt)}
                          </p>
                        )}
                      </div>
                      {task.status === "Pendiente" && !isAdminOrDirector && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="success"
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
                                Se marcará como completada y se abrirá el
                                registro de actividad. Esta acción no se puede
                                deshacer.
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
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="card self-start p-5">
          <p className="slabel mb-3">Regla del día</p>
          <div className="mb-3">
            <Badge variant={semaph.tag}>{semaph.label}</Badge>
          </div>
          <p className="rule-title">{semaph.rule}</p>
          <p className="rule-desc">{semaph.desc}</p>
          <Button
            variant="success"
            className="mb-2 w-full justify-center"
            onClick={() => void navigate({ to: "/agenda" })}
          >
            + Crear tarea
          </Button>
          <Button
            className="w-full justify-center"
            onClick={() => void navigate({ to: "/clientes" })}
          >
            + Nuevo prospecto
          </Button>
        </div>
      </div>
    </div>
  )
}
