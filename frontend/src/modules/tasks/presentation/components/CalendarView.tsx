import { useEffect, useRef, useState } from "react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import type { Task } from "../../domain/tasks.types"
import type { Client } from "@/modules/clients/domain/clients.types"

interface CalendarViewProps {
  year: number
  month: number
  tasks: Task[]
  clients: Client[]
  onEdit: (task: Task) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  viewMode?: "month" | "week" | "day"
  selectedDate?: Date
  onViewModeChange?: (mode: "month" | "week" | "day") => void
  onSelectedDateChange?: (date: Date) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
  onDayClick?: (date: Date) => void
}

const TYPE_TAG: Record<string, string> = {
  Llamada: "tag-navy",
  Videoconf: "tag-navy",
  "Reunión virtual": "tag-navy",
  Visita: "tag-green",
  "Reunión presencial": "tag-green",
  Propuesta: "tag-amber",
  Seguimiento: "tag-amber",
  Cierre: "tag-green",
  Chat: "tag-gray",
  WA: "tag-gray",
  Correo: "tag-gray",
}

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MAX_CHIPS_VISIBLE = 3

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function mondayBasedWeekday(date: Date): number {
  return (date.getDay() + 6) % 7
}

function getWeekDates(date: Date): Date[] {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(date.getDate() + i)
    return date
  })
}

function getHourSlots(): number[] {
  return Array.from({ length: 24 }, (_, i) => i)
}

function getTasksForHour(hour: number, tasks: Task[]): Task[] {
  return tasks
    .filter((t) => new Date(t.scheduledAt).getHours() === hour)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
}

function CalendarViewToggle({
  viewMode = "month",
  onChange,
}: {
  viewMode?: "month" | "week" | "day"
  onChange?: (mode: "month" | "week" | "day") => void
}) {
  if (!onChange) return null
  const modes = [
    { id: "month", label: "Mes" },
    { id: "week", label: "Semana" },
    { id: "day", label: "Día" },
  ] as const

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {modes.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            padding: "6px 12px",
            border: viewMode === id ? "2px solid #3B82F6" : "1px solid #E2E8F0",
            borderRadius: 6,
            backgroundColor: viewMode === id ? "#EFF6FF" : "#FFFFFF",
            color: viewMode === id ? "#2563EB" : "#475569",
            fontWeight: viewMode === id ? 600 : 500,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

interface TaskChipProps {
  task: Task
  client: Client | undefined
  isDragging?: boolean
  onEdit?: (task: Task) => void
}

function TaskChip({ task, client, isDragging, onEdit }: TaskChipProps) {
  const taskRef = useRef<HTMLButtonElement>(null)
  const [internalDragging, setInternalDragging] = useState(false)

  useEffect(() => {
    const el = taskRef.current
    if (!el) return

    const setupDragAndDrop = async () => {
      try {
        const module =
          await import("@atlaskit/pragmatic-drag-and-drop/element/adapter")
        const { draggable } = module
        if (typeof draggable === "undefined") return

        return draggable({
          element: el,
          getInitialData: () => ({ taskId: task.id, type: "calendar-task" }),
          onDragStart: () => setInternalDragging(true),
          onDrop: () => setInternalDragging(false),
        })
      } catch {
        return undefined
      }
    }

    setupDragAndDrop()
  }, [task.id])

  const tagClass = task.type ? (TYPE_TAG[task.type] ?? "tag-gray") : "tag-gray"
  const chipLabel = [
    formatTime(task.scheduledAt),
    task.type ?? null,
    client?.name ?? null,
    task.sellerName ?? null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          ref={taskRef}
          onClick={() => onEdit?.(task)}
          className={`tag ${tagClass}`}
          style={{
            fontSize: 11,
            cursor: "grab",
            textAlign: "left",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
            border: "none",
            display: "block",
            width: "100%",
            opacity:
              internalDragging || isDragging
                ? 0.5
                : task.status === "Completado"
                  ? 0.5
                  : 1,
          }}
        >
          {chipLabel}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-64 overflow-hidden p-0"
      >
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {task.type && (
              <span className={`tag ${tagClass}`} style={{ fontSize: 11 }}>
                {task.type}
              </span>
            )}
            {task.sellerName && (
              <span className="tag tag-navy" style={{ fontSize: 11 }}>
                {task.sellerName}
              </span>
            )}
            <span
              className={`tag ${task.status === "Completado" ? "tag-gray" : task.isOverdue ? "tag-red" : "tag-green"}`}
              style={{ fontSize: 11, marginLeft: "auto" }}
            >
              {task.status === "Completado"
                ? "Completada"
                : task.isOverdue
                  ? "Vencida"
                  : "Pendiente"}
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#0F172A",
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {task.title}
          </p>
          {client && (
            <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
              {client.name}
            </p>
          )}
          {task.description && (
            <p
              style={{
                fontSize: 11.5,
                color: "#64748B",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {task.description}
            </p>
          )}
          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
            {formatDateTime(task.scheduledAt)}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

interface MonthViewProps {
  year: number
  month: number
  tasks: Task[]
  clients: Client[]
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
  onDayClick?: (date: Date) => void
}

function MonthView({
  year,
  month,
  tasks,
  clients,
  onEdit,
  onTaskReschedule,
  onDayClick,
}: MonthViewProps) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = new Date(year, month - 1, 1)
  const leadingEmpty = mondayBasedWeekday(firstDay)
  const totalCells = Math.ceil((leadingEmpty + daysInMonth) / 7) * 7

  const today = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()

  function getTasksForDay(day: number): Task[] {
    return tasks
      .filter((t) => new Date(t.scheduledAt).getDate() === day)
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 2,
        }}
      >
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#94A3B8",
              padding: "4px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {name}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - leadingEmpty + 1
          const isValidDay = dayNum >= 1 && dayNum <= daysInMonth
          const isToday =
            isValidDay &&
            year === todayY &&
            month === todayM &&
            dayNum === todayD
          const dayTasks = isValidDay ? getTasksForDay(dayNum) : []
          const overflow =
            dayTasks.length > MAX_CHIPS_VISIBLE
              ? dayTasks.length - MAX_CHIPS_VISIBLE
              : 0
          const visibleTasks = dayTasks.slice(0, MAX_CHIPS_VISIBLE)
          const cellDate = isValidDay ? new Date(year, month - 1, dayNum) : null

          return (
            <MonthDayCell
              key={i}
              dayNum={dayNum}
              year={year}
              month={month}
              isValidDay={isValidDay}
              isToday={isToday}
              visibleTasks={visibleTasks}
              overflow={overflow}
              clients={clients}
              onEdit={onEdit}
              onTaskReschedule={onTaskReschedule}
              onDayClick={cellDate ? () => onDayClick?.(cellDate) : undefined}
            />
          )
        })}
      </div>
    </>
  )
}

interface MonthDayCellProps {
  dayNum: number
  year: number
  month: number
  isValidDay: boolean
  isToday: boolean
  visibleTasks: Task[]
  overflow: number
  clients: Client[]
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
  onDayClick?: () => void
}

function MonthDayCell({
  dayNum,
  year,
  month,
  isValidDay,
  isToday,
  visibleTasks,
  overflow,
  clients,
  onEdit,
  onTaskReschedule,
  onDayClick,
}: MonthDayCellProps) {
  const cellRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const el = cellRef.current
    if (!el || !isValidDay) return

    const setupDropZone = async () => {
      try {
        const module =
          await import("@atlaskit/pragmatic-drag-and-drop/element/adapter")
        const { dropTargetForElements } = module
        if (typeof dropTargetForElements === "undefined") return

        const cellDate = new Date(year, month - 1, dayNum)

        return dropTargetForElements({
          element: el,
          getData: () => ({ date: cellDate.toISOString() }),
          onDragEnter: () => setIsDragOver(true),
          onDragLeave: () => setIsDragOver(false),
          onDrop: ({
            source,
          }: {
            source: { data: Record<string, unknown> }
          }) => {
            const taskId = source.data.taskId as string
            if (taskId && onTaskReschedule && isValidDay) {
              onTaskReschedule(taskId, cellDate.toISOString())
            }
            setIsDragOver(false)
          },
        })
      } catch {
        return undefined
      }
    }

    setupDropZone()
  }, [dayNum, year, month, isValidDay, onTaskReschedule])

  return (
    <div
      ref={cellRef}
      onClick={onDayClick}
      style={{
        minHeight: 90,
        border: isToday ? "2px solid #3B82F6" : "1px solid #E2E8F0",
        borderRadius: 6,
        backgroundColor: isDragOver
          ? "#F0F9FF"
          : isToday
            ? "#EFF6FF"
            : isValidDay
              ? "#FFFFFF"
              : "#F8FAFC",
        padding: 4,
        overflow: "hidden",
        cursor: onDayClick ? "pointer" : "default",
      }}
    >
      {isValidDay && (
        <>
          <div
            style={{
              fontSize: 12,
              fontWeight: isToday ? 700 : 500,
              color: isToday ? "#2563EB" : "#475569",
              marginBottom: 3,
              lineHeight: 1,
            }}
          >
            {dayNum}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {visibleTasks.map((task) => {
              const client = clients.find((c) => c.id === task.clientId)
              return (
                <TaskChip
                  key={task.id}
                  task={task}
                  client={client}
                  onEdit={onEdit}
                />
              )
            })}
            {overflow > 0 && (
              <span style={{ fontSize: 10, color: "#94A3B8", paddingLeft: 2 }}>
                +{overflow} más
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface WeekViewProps {
  selectedDate: Date
  tasks: Task[]
  clients: Client[]
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

function WeekView({
  selectedDate,
  tasks,
  clients,
  onEdit,
  onTaskReschedule,
  onPrevWeek,
  onNextWeek,
}: WeekViewProps) {
  const weekDates = getWeekDates(selectedDate)
  const weekStart = weekDates[0].toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  })
  const weekEnd = weekDates[6].toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  })
  const weekLabel = `${weekStart} - ${weekEnd}`

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          onClick={onPrevWeek}
          style={{
            background: "none",
            border: "1px solid #E2E8F0",
            borderRadius: 6,
            cursor: "pointer",
            padding: "5px 10px",
            color: "#475569",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          ←
        </button>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0F172A",
            minWidth: 200,
            textAlign: "center",
          }}
        >
          {weekLabel}
        </span>
        <button
          onClick={onNextWeek}
          style={{
            background: "none",
            border: "1px solid #E2E8F0",
            borderRadius: 6,
            cursor: "pointer",
            padding: "5px 10px",
            color: "#475569",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          →
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 2,
        }}
      >
        {weekDates.map((date) => {
          const dayName = date.toLocaleDateString("es-MX", { weekday: "short" })
          const dayNum = date.getDate()
          return (
            <div
              key={date.toISOString()}
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#94A3B8",
                padding: "4px 0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {dayName} {dayNum}
            </div>
          )
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {weekDates.map((date) => (
          <WeekDayColumn
            key={date.toISOString()}
            date={date}
            tasks={tasks.filter((t) => {
              const tDate = new Date(t.scheduledAt)
              return (
                tDate.getDate() === date.getDate() &&
                tDate.getMonth() === date.getMonth() &&
                tDate.getFullYear() === date.getFullYear()
              )
            })}
            clients={clients}
            onEdit={onEdit}
            onTaskReschedule={onTaskReschedule}
          />
        ))}
      </div>
    </>
  )
}

interface WeekDayColumnProps {
  date: Date
  tasks: Task[]
  clients: Client[]
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
}

function WeekDayColumn({
  date,
  tasks,
  clients,
  onEdit,
  onTaskReschedule,
}: WeekDayColumnProps) {
  const colRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const el = colRef.current
    if (!el) return

    const setupDropZone = async () => {
      try {
        const module =
          await import("@atlaskit/pragmatic-drag-and-drop/element/adapter")
        const { dropTargetForElements } = module
        if (typeof dropTargetForElements === "undefined") return

        return dropTargetForElements({
          element: el,
          getData: () => ({ date: date.toISOString() }),
          onDragEnter: () => setIsDragOver(true),
          onDragLeave: () => setIsDragOver(false),
          onDrop: ({
            source,
          }: {
            source: { data: Record<string, unknown> }
          }) => {
            const taskId = source.data.taskId as string
            if (taskId && onTaskReschedule) {
              onTaskReschedule(taskId, date.toISOString())
            }
            setIsDragOver(false)
          },
        })
      } catch {
        return undefined
      }
    }

    setupDropZone()
  }, [date, onTaskReschedule])

  return (
    <div
      ref={colRef}
      style={{
        minHeight: 150,
        border: "1px solid #E2E8F0",
        borderRadius: 6,
        backgroundColor: isDragOver ? "#F0F9FF" : "#FFFFFF",
        padding: 4,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {tasks.map((task) => {
          const client = clients.find((c) => c.id === task.clientId)
          return (
            <TaskChip
              key={task.id}
              task={task}
              client={client}
              onEdit={onEdit}
            />
          )
        })}
      </div>
    </div>
  )
}

interface DayViewProps {
  selectedDate: Date
  tasks: Task[]
  clients: Client[]
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
  onPrevDay: () => void
  onNextDay: () => void
}

function DayView({
  selectedDate,
  tasks,
  clients,
  onEdit,
  onTaskReschedule,
  onPrevDay,
  onNextDay,
}: DayViewProps) {
  const dayLabel = selectedDate.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          onClick={onPrevDay}
          style={{
            background: "none",
            border: "1px solid #E2E8F0",
            borderRadius: 6,
            cursor: "pointer",
            padding: "5px 10px",
            color: "#475569",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          ←
        </button>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0F172A",
            minWidth: 300,
            textAlign: "center",
            textTransform: "capitalize",
          }}
        >
          {dayLabel}
        </span>
        <button
          onClick={onNextDay}
          style={{
            background: "none",
            border: "1px solid #E2E8F0",
            borderRadius: 6,
            cursor: "pointer",
            padding: "5px 10px",
            color: "#475569",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          →
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 2 }}>
        {getHourSlots().map((hour) => {
          const hourTasks = getTasksForHour(hour, tasks)
          const timeLabel = `${String(hour).padStart(2, "0")}:00`
          return (
            <DayHourRow
              key={hour}
              hour={hour}
              timeLabel={timeLabel}
              tasks={hourTasks}
              date={selectedDate}
              clients={clients}
              onEdit={onEdit}
              onTaskReschedule={onTaskReschedule}
            />
          )
        })}
      </div>
    </>
  )
}

interface DayHourRowProps {
  hour: number
  timeLabel: string
  tasks: Task[]
  date: Date
  clients: Client[]
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
}

function DayHourRow({
  hour,
  timeLabel,
  tasks,
  date,
  clients,
  onEdit,
  onTaskReschedule,
}: DayHourRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const newDate = new Date(date)
    newDate.setHours(hour, 0, 0, 0)

    const setupDropZone = async () => {
      try {
        const module =
          await import("@atlaskit/pragmatic-drag-and-drop/element/adapter")
        const { dropTargetForElements } = module
        if (typeof dropTargetForElements === "undefined") return

        return dropTargetForElements({
          element: el,
          getData: () => ({ date: newDate.toISOString() }),
          onDragEnter: () => setIsDragOver(true),
          onDragLeave: () => setIsDragOver(false),
          onDrop: ({
            source,
          }: {
            source: { data: Record<string, unknown> }
          }) => {
            const taskId = source.data.taskId as string
            if (taskId && onTaskReschedule) {
              onTaskReschedule(taskId, newDate.toISOString())
            }
            setIsDragOver(false)
          },
        })
      } catch {
        return undefined
      }
    }

    setupDropZone()
  }, [hour, date, onTaskReschedule])

  return (
    <>
      <div
        style={{
          textAlign: "right",
          fontSize: 11,
          color: "#94A3B8",
          fontWeight: 600,
          padding: "4px 8px",
          borderRight: "1px solid #E2E8F0",
        }}
      >
        {timeLabel}
      </div>
      <div
        ref={rowRef}
        style={{
          minHeight: 50,
          border: "1px solid #E2E8F0",
          borderRadius: 4,
          backgroundColor: isDragOver ? "#F0F9FF" : "#FFFFFF",
          padding: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {tasks.map((task) => {
          const client = clients.find((c) => c.id === task.clientId)
          return (
            <TaskChip
              key={task.id}
              task={task}
              client={client}
              onEdit={onEdit}
            />
          )
        })}
      </div>
    </>
  )
}

export function CalendarView({
  year,
  month,
  tasks,
  clients,
  onEdit,
  onPrevMonth,
  onNextMonth,
  viewMode = "month",
  selectedDate,
  onViewModeChange,
  onSelectedDateChange,
  onTaskReschedule,
  onDayClick,
}: CalendarViewProps) {
  const [currentViewMode, setCurrentViewMode] = useState<
    "month" | "week" | "day"
  >(viewMode)
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date>(
    selectedDate || new Date()
  )

  const handleViewModeChange = (mode: "month" | "week" | "day") => {
    setCurrentViewMode(mode)
    onViewModeChange?.(mode)
  }

  const handlePrevWeek = () => {
    const prev = new Date(currentSelectedDate)
    prev.setDate(prev.getDate() - 7)
    setCurrentSelectedDate(prev)
    onSelectedDateChange?.(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(currentSelectedDate)
    next.setDate(next.getDate() + 7)
    setCurrentSelectedDate(next)
    onSelectedDateChange?.(next)
  }

  const handlePrevDay = () => {
    const prev = new Date(currentSelectedDate)
    prev.setDate(prev.getDate() - 1)
    setCurrentSelectedDate(prev)
    onSelectedDateChange?.(prev)
  }

  const handleNextDay = () => {
    const next = new Date(currentSelectedDate)
    next.setDate(next.getDate() + 1)
    setCurrentSelectedDate(next)
    onSelectedDateChange?.(next)
  }

  const firstDay = new Date(year, month - 1, 1)
  const monthLabel = firstDay.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  })

  return (
    <div>
      <CalendarViewToggle
        viewMode={currentViewMode}
        onChange={handleViewModeChange}
      />

      {currentViewMode === "month" && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <button
              onClick={onPrevMonth}
              style={{
                background: "none",
                border: "1px solid #E2E8F0",
                borderRadius: 6,
                cursor: "pointer",
                padding: "5px 10px",
                color: "#475569",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              ←
            </button>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0F172A",
                textTransform: "capitalize",
                minWidth: 160,
                textAlign: "center",
              }}
            >
              {monthLabel}
            </span>
            <button
              onClick={onNextMonth}
              style={{
                background: "none",
                border: "1px solid #E2E8F0",
                borderRadius: 6,
                cursor: "pointer",
                padding: "5px 10px",
                color: "#475569",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              →
            </button>
          </div>
          <MonthView
            year={year}
            month={month}
            tasks={tasks}
            clients={clients}
            onEdit={onEdit}
            onTaskReschedule={onTaskReschedule}
            onDayClick={(date) => {
              setCurrentSelectedDate(date)
              onDayClick?.(date)
              onSelectedDateChange?.(date)
            }}
          />
        </>
      )}

      {currentViewMode === "week" && (
        <WeekView
          selectedDate={currentSelectedDate}
          tasks={tasks}
          clients={clients}
          onEdit={onEdit}
          onTaskReschedule={onTaskReschedule}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      )}

      {currentViewMode === "day" && (
        <DayView
          selectedDate={currentSelectedDate}
          tasks={tasks}
          clients={clients}
          onEdit={onEdit}
          onTaskReschedule={onTaskReschedule}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
        />
      )}
    </div>
  )
}
