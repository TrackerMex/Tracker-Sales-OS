import type { Task } from '../../domain/tasks.types'

interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ task }: { task: Task }) {
  if (task.status === 'Completado') {
    return (
      <span className="rounded-full bg-[#82bc00]/20 px-2 py-0.5 text-xs font-semibold text-[#4a6b00] border border-[#82bc00]/40">
        Completado
      </span>
    )
  }
  if (task.isOverdue) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-300">
        Vencida
      </span>
    )
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
      Pendiente
    </span>
  )
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        task.isOverdue && task.status === 'Pendiente' ? 'border-red-500' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">{formatTime(task.scheduledAt)}</span>
            <StatusBadge task={task} />
          </div>
          <p className="mt-1 text-sm font-semibold text-[#002B49] truncate">{task.title}</p>
          {task.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{task.description}</p>
          )}
        </div>
        {task.status === 'Pendiente' && (
          <button
            onClick={() => onComplete(task.id)}
            className="shrink-0 rounded-md bg-[#002B49] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#002B49]/90 transition-colors"
          >
            Completar
          </button>
        )}
      </div>
    </div>
  )
}
