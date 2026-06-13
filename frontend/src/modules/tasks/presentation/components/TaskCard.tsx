import type { Task } from '../../domain/tasks.types'

interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
  clientName?: string | null
  contactName?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function getAiComment(task: Task, clientName: string | null): string | null {
  if (task.status === 'Completado') return null
  const name = clientName ?? 'el contacto'
  if (task.isOverdue) return `Tarea vencida. Reagenda con ${name} y define una nueva fecha concreta.`
  return `Revisa: ¿esta tarea tiene un resultado medible? Si solo es "seguimiento", redefine con ${name}.`
}

export function TaskCard({ task, onComplete, clientName, contactName }: TaskCardProps) {
  const isOverdue = task.isOverdue && task.status === 'Pendiente'
  const aiComment = getAiComment(task, clientName ?? null)

  const header = [clientName || 'Sin cliente', task.type, contactName]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className="card"
      style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, opacity: task.status === 'Completado' ? 0.5 : 1 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{header}</p>
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{task.title}</p>
        {aiComment && (
          <p style={{ fontSize: 11.5, color: '#6D28D9', fontWeight: 500, marginBottom: 4 }}>IA: {aiComment}</p>
        )}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            Programada: {formatDate(task.scheduledAt)} {formatTime(task.scheduledAt)}
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            Creada: {formatDate(task.createdAt)}
          </span>
          {task.completedAt && (
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              Capturada: {formatDate(task.completedAt)}
            </span>
          )}
          {isOverdue && (
            <span className="tag tag-red">Vencida</span>
          )}
        </div>
      </div>

      {task.status === 'Pendiente' ? (
        <button
          onClick={() => onComplete(task.id)}
          className="btn-green"
          style={{ padding: '6px 11px', fontSize: 11 }}
        >
          Completar
        </button>
      ) : (
        <span className="tag tag-gray">Completada</span>
      )}
    </div>
  )
}
