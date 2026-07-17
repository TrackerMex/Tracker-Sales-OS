import { useEffect, useRef, useState } from "react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Badge, type BadgeVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Task } from "../../domain/tasks.types"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
  year: number
  month: number
  tasks: Task[]
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

const TYPE_TAG: Record<string, BadgeVariant> = {
  Llamada: "navy",
  Videoconf: "navy",
  "Reunión virtual": "navy",
  Visita: "green",
  "Reunión presencial": "green",
  Propuesta: "amber",
  Seguimiento: "amber",
  Cierre: "green",
  Chat: "gray",
  WA: "gray",
  Correo: "gray",
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
    <Tabs
      value={viewMode}
      onValueChange={(value) => onChange(value as "month" | "week" | "day")}
      className="mb-4"
    >
      <TabsList>
        {modes.map(({ id, label }) => (
          <TabsTrigger key={id} value={id}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

interface TaskChipProps {
  task: Task
  isDragging?: boolean
  onEdit?: (task: Task) => void
}

function TaskChip({ task, isDragging, onEdit }: TaskChipProps) {
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

  const tagVariant = task.type ? (TYPE_TAG[task.type] ?? "gray") : "gray"
  const chipLabel = [
    formatTime(task.scheduledAt),
    task.type ?? null,
    task.clientName ?? null,
    task.sellerName ?? null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Badge variant={tagVariant} asChild>
          <Button
            ref={taskRef}
            variant="ghost"
            size="xs"
            onClick={() => onEdit?.(task)}
            className={cn(
              "h-auto w-full max-w-full cursor-grab justify-start truncate border-0 bg-transparent px-1 py-0.5 text-[11px] hover:bg-slate-100",
              (internalDragging ||
                isDragging ||
                task.status === "Completado") &&
                "opacity-50"
            )}
          >
            {chipLabel}
          </Button>
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-64 overflow-hidden p-0"
      >
        <div className="flex flex-col gap-2 px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            {task.type && (
              <Badge variant={tagVariant} className="text-[11px]">
                {task.type}
              </Badge>
            )}
            {task.sellerName && (
              <Badge variant="navy" className="text-[11px]">
                {task.sellerName}
              </Badge>
            )}
            <Badge
              variant={
                task.status === "Completado"
                  ? "gray"
                  : task.isOverdue
                    ? "red"
                    : "green"
              }
              className="ml-auto text-[11px]"
            >
              {task.status === "Completado"
                ? "Completada"
                : task.isOverdue
                  ? "Vencida"
                  : "Pendiente"}
            </Badge>
          </div>
          <p className="m-0 text-[13px] leading-[1.3] font-semibold text-tracker-text">
            {task.title}
          </p>
          {task.clientName && (
            <p className="m-0 text-xs text-slate-700">{task.clientName}</p>
          )}
          {task.description && (
            <p className="m-0 text-[11.5px] leading-[1.4] text-tracker-text-secondary">
              {task.description}
            </p>
          )}
          <p className="m-0 text-[11px] text-tracker-text-muted">
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
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
  onDayClick?: (date: Date) => void
}

function MonthView({
  year,
  month,
  tasks,
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
      <div className="mb-0.5 grid grid-cols-7 gap-0.5">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-1 text-center text-[11px] font-bold tracking-[0.05em] text-tracker-text-muted uppercase"
          >
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
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
      className={cn(
        "min-h-[90px] overflow-hidden rounded-md p-1",
        isToday ? "border-2 border-blue-500" : "border border-tracker-border",
        isDragOver
          ? "bg-[#F0F9FF]"
          : isToday
            ? "bg-blue-50"
            : isValidDay
              ? "bg-white"
              : "bg-tracker-surface-alt",
        onDayClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      {isValidDay && (
        <>
          <div
            className={cn(
              "mb-[3px] text-xs leading-none",
              isToday
                ? "font-bold text-blue-600"
                : "font-medium text-tracker-text-dim"
            )}
          >
            {dayNum}
          </div>
          <div className="flex flex-col gap-0.5">
            {visibleTasks.map((task) => (
              <TaskChip key={task.id} task={task} onEdit={onEdit} />
            ))}
            {overflow > 0 && (
              <span className="pl-0.5 text-[10px] text-tracker-text-muted">
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
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

function WeekView({
  selectedDate,
  tasks,
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
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onPrevWeek}
          aria-label="Semana anterior"
        >
          ←
        </Button>
        <span className="min-w-[200px] text-center text-sm font-bold text-tracker-text">
          {weekLabel}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onNextWeek}
          aria-label="Semana siguiente"
        >
          →
        </Button>
      </div>

      <div className="mb-0.5 grid grid-cols-7 gap-0.5">
        {weekDates.map((date) => {
          const dayName = date.toLocaleDateString("es-MX", { weekday: "short" })
          const dayNum = date.getDate()
          return (
            <div
              key={date.toISOString()}
              className="py-1 text-center text-[11px] font-bold tracking-[0.05em] text-tracker-text-muted uppercase"
            >
              {dayName} {dayNum}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
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
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
}

function WeekDayColumn({
  date,
  tasks,
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
      className={cn(
        "min-h-[150px] overflow-hidden rounded-md border border-tracker-border p-1",
        isDragOver ? "bg-[#F0F9FF]" : "bg-white"
      )}
    >
      <div className="flex flex-col gap-0.5">
        {tasks.map((task) => (
          <TaskChip key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}

interface DayViewProps {
  selectedDate: Date
  tasks: Task[]
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
  onPrevDay: () => void
  onNextDay: () => void
}

function DayView({
  selectedDate,
  tasks,
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
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onPrevDay}
          aria-label="Día anterior"
        >
          ←
        </Button>
        <span className="min-w-[300px] text-center text-sm font-bold text-tracker-text capitalize">
          {dayLabel}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onNextDay}
          aria-label="Día siguiente"
        >
          →
        </Button>
      </div>

      <div className="grid grid-cols-[60px_1fr] gap-0.5">
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
  onEdit: (task: Task) => void
  onTaskReschedule?: (taskId: string, newDate: string) => void
}

function DayHourRow({
  hour,
  timeLabel,
  tasks,
  date,
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
      <div className="border-r border-tracker-border px-2 py-1 text-right text-[11px] font-semibold text-tracker-text-muted">
        {timeLabel}
      </div>
      <div
        ref={rowRef}
        className={cn(
          "flex min-h-[50px] flex-col gap-0.5 rounded border border-tracker-border p-1",
          isDragOver ? "bg-[#F0F9FF]" : "bg-white"
        )}
      >
        {tasks.map((task) => (
          <TaskChip key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
    </>
  )
}

export function CalendarView({
  year,
  month,
  tasks,
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
          <div className="mb-4 flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onPrevMonth}
              aria-label="Mes anterior"
            >
              ←
            </Button>
            <span className="min-w-40 text-center text-sm font-bold text-tracker-text capitalize">
              {monthLabel}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onNextMonth}
              aria-label="Mes siguiente"
            >
              →
            </Button>
          </div>
          <MonthView
            year={year}
            month={month}
            tasks={tasks}
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
          onEdit={onEdit}
          onTaskReschedule={onTaskReschedule}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
        />
      )}
    </div>
  )
}
