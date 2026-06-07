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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#002B49]">Agenda del día</h1>
          {tasks.length > 0 && (
            <span className="rounded-full bg-[#002B49]/10 px-3 py-1 text-sm font-semibold text-[#002B49]">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-[#002B49] px-4 py-2 text-sm font-medium text-white hover:bg-[#002B49]/90 transition-colors"
        >
          {showForm ? 'Cancelar' : 'Nueva tarea'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Nueva tarea</h2>
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
        <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-400">No hay tareas para hoy</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-[#002B49] underline hover:no-underline"
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
