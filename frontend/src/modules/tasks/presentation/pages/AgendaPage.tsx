import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useClients } from "@/modules/clients/application/hooks/useClients"
import { useTodayTasks } from "../../application/hooks/useTodayTasks"
import { useMonthTasks } from "../../application/hooks/useMonthTasks"
import { useTeamMonthTasks } from "../../application/hooks/useTeamMonthTasks"
import { useCreateTask } from "../../application/hooks/useCreateTask"
import { useCompleteTask } from "../../application/hooks/useCompleteTask"
import { useUpdateTask } from "../../application/hooks/useUpdateTask"
import { useReactivateTask } from "../../application/hooks/useReactivateTask"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { TaskCard } from "../components/TaskCard"
import { CalendarView } from "../components/CalendarView"
import { CreateTaskForm } from "../components/CreateTaskForm"
import { EditTaskForm } from "../components/EditTaskForm"
import type {
  CreateTaskInput,
  UpdateTaskInput,
  Task,
} from "../../domain/tasks.types"

export function AgendaPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "calendar">(() => {
    return (
      (localStorage.getItem("agenda_view_mode") as "list" | "calendar") ??
      "list"
    )
  })
  const todayInit = new Date()
  const [calYear, setCalYear] = useState(todayInit.getFullYear())
  const [calMonth, setCalMonth] = useState(todayInit.getMonth() + 1)

  const [calendarViewMode, setCalendarViewMode] = useState<
    "month" | "week" | "day"
  >(() => {
    return (
      (localStorage.getItem("calendar_view_mode") as
        | "month"
        | "week"
        | "day") ?? "month"
    )
  })

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const stored = localStorage.getItem("calendar_selected_date")
    if (stored) {
      return new Date(stored)
    }
    return new Date()
  })

  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>()

  const currentUser = useAppStore((s) => s.currentUser)
  const isAdminOrDirector =
    currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Director

  const [selectedSeller, setSelectedSeller] = useState<string>(() => {
    return localStorage.getItem('tasks_team_seller_filter') ?? 'all'
  })

  const { data: sellers = [] } = useSellers()

  const { data: tasks = [], isLoading } = useTodayTasks()
  const {
    mutate: createTask,
    isPending: isCreating,
    error: createError,
    reset: resetCreateTask,
  } = useCreateTask()
  const { mutate: completeTask } = useCompleteTask()
  const {
    mutate: updateTask,
    isPending: isUpdating,
    error: updateError,
    reset: resetUpdateTask,
  } = useUpdateTask()
  const { mutate: reactivateTask } = useReactivateTask()
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []
  const navigate = useNavigate()

  const isTeamMode = isAdminOrDirector && selectedSeller === 'all'

  const { data: monthTasksRaw = [] } = useMonthTasks(calYear, calMonth)
  const { data: teamMonthTasksRaw = [] } = useTeamMonthTasks(
    calYear,
    calMonth,
    isAdminOrDirector,
  )

  const sellerMap = Object.fromEntries(sellers.map((s) => [s.id, s.name]))

  const enrichedTeamTasks = teamMonthTasksRaw.map((t) => ({
    ...t,
    sellerName: sellerMap[t.sellerId] ?? undefined,
  }))

  const monthTasks = isTeamMode ? enrichedTeamTasks : monthTasksRaw

  function handleToggleView(mode: "list" | "calendar") {
    setViewMode(mode)
    localStorage.setItem("agenda_view_mode", mode)
  }

  function handleCalendarViewModeChange(mode: "month" | "week" | "day") {
    setCalendarViewMode(mode)
    localStorage.setItem("calendar_view_mode", mode)
  }

  function handleSelectedDateChange(date: Date) {
    setSelectedDate(date)
    localStorage.setItem("calendar_selected_date", date.toISOString())
  }

  function handleTaskReschedule(taskId: string, newDateISO: string) {
    const task = monthTasks.find((t) => t.id === taskId)
    if (!task) return

    const newDate = new Date(newDateISO)
    const oldTime = new Date(task.scheduledAt)

    // Mantener la hora original de la tarea
    const combined = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      oldTime.getHours(),
      oldTime.getMinutes()
    )

    updateTask(
      { taskId, input: { scheduledAt: combined.toISOString() } },
      {
        onSuccess: () => toast.success("Tarea reprogramada"),
        onError: () => toast.error("No se pudo reprogramar la tarea"),
      }
    )
  }

  function handleDayClick(date: Date) {
    setPrefilledDate(date)
    setShowCreateModal(true)
    resetCreateTask()
  }

  function handleComplete(taskId: string) {
    const task = tasks.find((t) => t.id === taskId)
    completeTask(taskId, {
      onSuccess: (completedTask) => {
        toast.success("Tarea completada")
        void navigate({
          to: "/actividades/nueva",
          search: {
            ...(completedTask.clientId
              ? { clientId: completedTask.clientId }
              : {}),
            ...(task?.title ? { taskTitle: task.title } : {}),
            taskId: taskId,
          },
        })
      },
      onError: () => toast.error("No se pudo completar la tarea"),
    })
  }

  function handleCreateTask(input: CreateTaskInput) {
    createTask(input, {
      onSuccess: () => {
        setShowCreateModal(false)
        toast.success("Tarea creada")
      },
      onError: () => toast.error("No se pudo crear la tarea"),
    })
  }

  function handleUpdateTask(input: UpdateTaskInput) {
    if (!editingTask) return
    updateTask(
      { taskId: editingTask.id, input },
      {
        onSuccess: () => {
          setEditingTask(null)
          toast.success("Tarea actualizada")
        },
        onError: () => toast.error("No se pudo actualizar la tarea"),
      }
    )
  }

  function handleReactivate(taskId: string) {
    reactivateTask(taskId, {
      onSuccess: () => toast.success("Tarea reactivada"),
      onError: () => toast.error("No se pudo reactivar la tarea"),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
          Compromisos comerciales
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {viewMode === "calendar" && isAdminOrDirector && (
            <select
              value={selectedSeller}
              onChange={(e) => {
                setSelectedSeller(e.target.value)
                localStorage.setItem('tasks_team_seller_filter', e.target.value)
              }}
              style={{
                fontSize: 13,
                padding: '4px 8px',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                backgroundColor: '#fff',
                color: '#0F172A',
                cursor: 'pointer',
              }}
            >
              <option value="all">Todos los vendedores</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <div
            style={{
              display: "flex",
              border: "1px solid #E2E8F0",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => handleToggleView("list")}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: viewMode === "list" ? "#0F172A" : "#FFFFFF",
                color: viewMode === "list" ? "#FFFFFF" : "#475569",
              }}
            >
              Lista
            </button>
            <button
              onClick={() => handleToggleView("calendar")}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                borderLeft: "1px solid #E2E8F0",
                backgroundColor:
                  viewMode === "calendar" ? "#0F172A" : "#FFFFFF",
                color: viewMode === "calendar" ? "#FFFFFF" : "#475569",
              }}
            >
              Calendario
            </button>
          </div>
          <button
            onClick={() => {
              resetCreateTask()
              setShowCreateModal(true)
            }}
            className="btn-primary"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Crear tarea
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p>Sin tareas registradas</p>
            <button
              onClick={() => {
                resetCreateTask()
                setShowCreateModal(true)
              }}
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#002B49",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Crear una tarea
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const client = clients.find((c) => c.id === task.clientId)
              const contact = client?.contacts.find(
                (c) => c.id === task.contactId
              )
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  clientName={client?.name ?? null}
                  contactName={contact?.name ?? null}
                  onComplete={handleComplete}
                  onEdit={(t) => {
                    resetUpdateTask()
                    setEditingTask(t)
                  }}
                  onReactivate={handleReactivate}
                />
              )
            })}
          </div>
        )
      ) : (
        <CalendarView
          year={calYear}
          month={calMonth}
          tasks={monthTasks}
          clients={clients}
          onEdit={(t) => {
            resetUpdateTask()
            setEditingTask(t)
          }}
          onPrevMonth={() => {
            if (calMonth === 1) {
              setCalYear((y) => y - 1)
              setCalMonth(12)
            } else setCalMonth((m) => m - 1)
          }}
          onNextMonth={() => {
            if (calMonth === 12) {
              setCalYear((y) => y + 1)
              setCalMonth(1)
            } else setCalMonth((m) => m + 1)
          }}
          viewMode={calendarViewMode}
          selectedDate={selectedDate}
          onViewModeChange={handleCalendarViewModeChange}
          onSelectedDateChange={handleSelectedDateChange}
          onTaskReschedule={handleTaskReschedule}
          onDayClick={handleDayClick}
        />
      )}

      {showCreateModal && (
        <CreateTaskForm
          onSubmit={handleCreateTask}
          onClose={() => {
            setShowCreateModal(false)
            resetCreateTask()
            setPrefilledDate(undefined)
          }}
          isLoading={isCreating}
          error={createError}
          initialDate={prefilledDate}
        />
      )}

      {editingTask && (
        <EditTaskForm
          task={editingTask}
          onSubmit={handleUpdateTask}
          onClose={() => {
            setEditingTask(null)
            resetUpdateTask()
          }}
          isLoading={isUpdating}
          error={updateError}
        />
      )}
    </div>
  )
}
