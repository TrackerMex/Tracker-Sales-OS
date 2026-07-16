import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useTodayTasks } from "../../application/hooks/useTodayTasks"
import { useMonthTasks } from "../../application/hooks/useMonthTasks"
import { useTeamMonthTasks } from "../../application/hooks/useTeamMonthTasks"
import { useCreateTask } from "../../application/hooks/useCreateTask"
import { useCompleteTask } from "../../application/hooks/useCompleteTask"
import { useUpdateTask } from "../../application/hooks/useUpdateTask"
import { useReactivateTask } from "../../application/hooks/useReactivateTask"
import { useDeleteTask } from "../../application/hooks/useDeleteTask"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Director

  const [selectedSeller, setSelectedSeller] = useState<string>(() => {
    return localStorage.getItem("tasks_team_seller_filter") ?? "all"
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
  const { mutate: deleteTask } = useDeleteTask()
  const navigate = useNavigate()

  const { data: monthTasksRaw = [] } = useMonthTasks(calYear, calMonth)
  const { data: teamMonthTasksRaw = [] } = useTeamMonthTasks(
    calYear,
    calMonth,
    isAdminOrDirector
  )

  const sellerMap = Object.fromEntries(sellers.map((s) => [s.id, s.name]))

  const enrichedTeamTasks = teamMonthTasksRaw.map((t) => ({
    ...t,
    sellerName: sellerMap[t.sellerId] ?? undefined,
  }))

  const monthTasks = isAdminOrDirector
    ? selectedSeller === "all"
      ? enrichedTeamTasks
      : enrichedTeamTasks.filter((t) => t.sellerId === selectedSeller)
    : monthTasksRaw

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
            ...(completedTask.clientName
              ? { clientName: completedTask.clientName }
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

  function handleDelete(taskId: string) {
    deleteTask(taskId, {
      onSuccess: () => toast.success("Tarea eliminada"),
      onError: () => toast.error("No se pudo eliminar la tarea"),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-tracker-text">
          Compromisos comerciales
        </h1>
        <div className="flex items-center gap-2">
          {viewMode === "calendar" && isAdminOrDirector && (
            <Select
              value={selectedSeller}
              onValueChange={(value) => {
                setSelectedSeller(value)
                localStorage.setItem("tasks_team_seller_filter", value)
              }}
            >
              <SelectTrigger className="h-8 w-[190px] rounded-md bg-white px-2 py-1 text-[13px]">
                <SelectValue placeholder="Todos los vendedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los vendedores</SelectItem>
                {sellers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Tabs
            value={viewMode}
            onValueChange={(value) =>
              handleToggleView(value as "list" | "calendar")
            }
          >
            <TabsList>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            onClick={() => {
              resetCreateTask()
              setShowCreateModal(true)
            }}
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
          </Button>
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
            <Button
              variant="link"
              onClick={() => {
                resetCreateTask()
                setShowCreateModal(true)
              }}
              className="mt-2 h-auto px-0 py-0 text-xs text-[#002B49]"
            >
              Crear una tarea
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                clientName={task.clientName ?? null}
                contactName={task.contactName ?? null}
                onComplete={handleComplete}
                onEdit={(t) => {
                  resetUpdateTask()
                  setEditingTask(t)
                }}
                onReactivate={handleReactivate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      ) : (
        <CalendarView
          year={calYear}
          month={calMonth}
          tasks={monthTasks}
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
