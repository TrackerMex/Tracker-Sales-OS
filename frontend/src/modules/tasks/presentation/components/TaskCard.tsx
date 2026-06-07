import type { Task } from '../../domain/tasks.types'

interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
  clientName?: string | null
}

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function getAiComment(task: Task, clientName: string | null): string | null {
  if (task.status === 'Completado') return null
  const name = clientName ?? 'el contacto'
  if (task.isOverdue) {
    return `Tarea vencida. Reagenda con ${name} y define una nueva fecha concreta.`
  }
  return `Revisa: ¿esta tarea tiene un resultado medible? Si solo es "seguimiento", redefine con ${name}.`
}

export function TaskCard({ task, onComplete, clientName }: TaskCardProps) {
  const isOverdue = task.isOverdue && task.status === 'Pendiente'
  const aiComment = getAiComment(task, clientName ?? null)

  return (
    <div className={`card p-4 ${isOverdue ? 'border-red-300' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{
                background: isOverdue ? '#FEE2E2' : '#E8F2F9',
                color: isOverdue ? 'var(--tracker-danger-dark)' : 'var(--tracker-blue)',
              }}
            >
              {isOverdue ? 'Vencida' : task.status}
            </span>
            <span className="text-[11px] font-medium" style={{ color: 'var(--tracker-text-muted)' }}>
              {formatDate(task.scheduledAt)} · {formatTime(task.scheduledAt)}
            </span>
          </div>

          <p className="mt-1.5 truncate text-sm font-semibold" style={{ color: 'var(--tracker-text)' }}>
            {task.title}
          </p>

          {clientName && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--tracker-text-secondary)' }}>
              {clientName}
            </p>
          )}
        </div>

        {task.status === 'Pendiente' && (
          <button
            onClick={() => onComplete(task.id)}
            className="btn-green shrink-0"
          >
            Completar
          </button>
        )}
      </div>

      {aiComment && (
        <div className="mt-3 ai-box">
          {aiComment}
        </div>
      )}
    </div>
  )
}
