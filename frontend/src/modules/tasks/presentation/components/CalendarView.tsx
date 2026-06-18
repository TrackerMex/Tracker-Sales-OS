import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import type { Task } from '../../domain/tasks.types'
import type { Client } from '@/modules/clients/domain/clients.types'

interface CalendarViewProps {
  year: number
  month: number
  tasks: Task[]
  clients: Client[]
  onEdit: (task: Task) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

const TYPE_TAG: Record<string, string> = {
  'Llamada': 'tag-navy',
  'Videoconf': 'tag-navy',
  'Reunión virtual': 'tag-navy',
  'Visita': 'tag-green',
  'Reunión presencial': 'tag-green',
  'Propuesta': 'tag-amber',
  'Seguimiento': 'tag-amber',
  'Cierre': 'tag-green',
  'Chat': 'tag-gray',
  'WA': 'tag-gray',
  'Correo': 'tag-gray',
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MAX_CHIPS_VISIBLE = 3

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// Monday-based: returns 0 for Mon, 6 for Sun
function mondayBasedWeekday(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function CalendarView({ year, month, tasks, clients, onEdit, onPrevMonth, onNextMonth }: CalendarViewProps) {
  const today = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = new Date(year, month - 1, 1)
  const leadingEmpty = mondayBasedWeekday(firstDay)

  const totalCells = Math.ceil((leadingEmpty + daysInMonth) / 7) * 7

  const monthLabel = firstDay.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

  function getTasksForDay(day: number): Task[] {
    return tasks
      .filter((t) => new Date(t.scheduledAt).getDate() === day)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }

  return (
    <div>
      {/* Month navigation header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={onPrevMonth}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', padding: '5px 10px', color: '#475569', fontWeight: 600, fontSize: 14 }}
        >
          ←
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', textTransform: 'capitalize', minWidth: 160, textAlign: 'center' }}>
          {monthLabel}
        </span>
        <button
          onClick={onNextMonth}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', padding: '5px 10px', color: '#475569', fontWeight: 600, fontSize: 14 }}
        >
          →
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94A3B8', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - leadingEmpty + 1
          const isValidDay = dayNum >= 1 && dayNum <= daysInMonth
          const isToday = isValidDay && year === todayY && month === todayM && dayNum === todayD
          const dayTasks = isValidDay ? getTasksForDay(dayNum) : []
          const overflow = dayTasks.length > MAX_CHIPS_VISIBLE ? dayTasks.length - MAX_CHIPS_VISIBLE : 0
          const visibleTasks = dayTasks.slice(0, MAX_CHIPS_VISIBLE)

          return (
            <div
              key={i}
              style={{
                minHeight: 90,
                border: isToday ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                borderRadius: 6,
                backgroundColor: isToday ? '#EFF6FF' : isValidDay ? '#FFFFFF' : '#F8FAFC',
                padding: 4,
                overflow: 'hidden',
              }}
            >
              {isValidDay && (
                <>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? '#2563EB' : '#475569',
                      marginBottom: 3,
                      lineHeight: 1,
                    }}
                  >
                    {dayNum}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {visibleTasks.map((task) => {
                      const client = clients.find((c) => c.id === task.clientId)
                      const tagClass = task.type ? (TYPE_TAG[task.type] ?? 'tag-gray') : 'tag-gray'
                      const chipLabel = [
                        formatTime(task.scheduledAt),
                        task.type ?? null,
                        client?.name ?? null,
                      ]
                        .filter(Boolean)
                        .join(' · ')

                      return (
                        <HoverCard key={task.id} openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <button
                              onClick={() => onEdit(task)}
                              className={`tag ${tagClass}`}
                              style={{
                                fontSize: 11,
                                cursor: 'pointer',
                                textAlign: 'left',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
                                border: 'none',
                                display: 'block',
                                width: '100%',
                                opacity: task.status === 'Completado' ? 0.5 : 1,
                              }}
                            >
                              {chipLabel}
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent side="right" align="start" className="w-64 p-0 overflow-hidden">
                            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {/* Header: type badge + status */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                {task.type && (
                                  <span className={`tag ${tagClass}`} style={{ fontSize: 11 }}>{task.type}</span>
                                )}
                                <span
                                  className={`tag ${task.status === 'Completado' ? 'tag-gray' : task.isOverdue ? 'tag-red' : 'tag-green'}`}
                                  style={{ fontSize: 11, marginLeft: 'auto' }}
                                >
                                  {task.status === 'Completado' ? 'Completada' : task.isOverdue ? 'Vencida' : 'Pendiente'}
                                </span>
                              </div>

                              {/* Title */}
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.3, margin: 0 }}>
                                {task.title}
                              </p>

                              {/* Client */}
                              {client && (
                                <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>{client.name}</p>
                              )}

                              {/* Description */}
                              {task.description && (
                                <p style={{ fontSize: 11.5, color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                                  {task.description}
                                </p>
                              )}

                              {/* Datetime */}
                              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                                {formatDateTime(task.scheduledAt)}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )
                    })}
                    {overflow > 0 && (
                      <span style={{ fontSize: 10, color: '#94A3B8', paddingLeft: 2 }}>+{overflow} más</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
