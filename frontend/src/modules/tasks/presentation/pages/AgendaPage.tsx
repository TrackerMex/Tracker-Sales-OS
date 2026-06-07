import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTodayTasks } from '../../application/hooks/useTodayTasks'
import { useCreateTask } from '../../application/hooks/useCreateTask'
import { useCompleteTask } from '../../application/hooks/useCompleteTask'
import { TaskCard } from '../components/TaskCard'
import { CreateTaskForm } from '../components/CreateTaskForm'
import type { CreateTaskInput } from '../../domain/tasks.types'

export function AgendaPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: tasks = [], isLoading } = useTodayTasks()
  const { mutate: createTask, isPending } = useCreateTask()
  const { mutate: completeTask } = useCompleteTask()
  const navigate = useNavigate()

  const pendingCount = tasks.filter((t) => t.status === 'Pendiente').length

  function handleComplete(taskId: string) {
    completeTask(taskId, {
      onSuccess: (completedTask) => {
        void navigate({
          to: '/actividades/nueva',
          search: completedTask.clientId ? { clientId: completedTask.clientId } : undefined,
        })
      },
    })
  }

  function handleCreateTask(input: CreateTaskInput) {
    createTask(input, {
      onSuccess: () => setShowForm(false),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Agenda del día</h1>
          {tasks.length > 0 && (
            <span className="tag tag-navy">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {showForm && (
            <button onClick={() => setShowForm(false)} className="btn-ghost">
              Cancelar
            </button>
          )}
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            {showForm ? 'Cerrar' : 'Nueva tarea'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="slabel mb-4">Nueva tarea</div>
          <CreateTaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
            isLoading={isPending}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <p>No hay tareas para hoy</p>
          <button
            onClick={() => setShowForm(true)}
            style={{ marginTop: 8, fontSize: 12, color: '#002B49', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Crear una tarea
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  )
}
