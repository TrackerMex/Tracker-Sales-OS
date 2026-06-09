import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useClients } from '@/modules/clients/application/hooks/useClients'
import { useTodayTasks } from '../../application/hooks/useTodayTasks'
import { useCreateTask } from '../../application/hooks/useCreateTask'
import { useCompleteTask } from '../../application/hooks/useCompleteTask'
import { TaskCard } from '../components/TaskCard'
import { CreateTaskForm } from '../components/CreateTaskForm'
import type { CreateTaskInput } from '../../domain/tasks.types'

export function AgendaPage() {
  const [showModal, setShowModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const { data: tasks = [], isLoading } = useTodayTasks()
  const { mutate: createTask, isPending } = useCreateTask()
  const { mutate: completeTask } = useCompleteTask()
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []
  const navigate = useNavigate()

  function handleComplete(taskId: string) {
    const task = tasks.find((t) => t.id === taskId)
    completeTask(taskId, {
      onSuccess: (completedTask) => {
        void navigate({
          to: '/actividades/nueva',
          search: {
            ...(completedTask.clientId ? { clientId: completedTask.clientId } : {}),
            ...(task?.title ? { taskTitle: task.title } : {}),
          },
        })
      },
    })
  }

  function handleCreateTask(input: CreateTaskInput) {
    setCreateError(null)
    createTask(input, {
      onSuccess: () => setShowModal(false),
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al guardar la tarea'
        setCreateError(msg)
      },
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Compromisos comerciales</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Crear tarea
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <p>Sin tareas registradas</p>
          <button
            onClick={() => setShowModal(true)}
            style={{ marginTop: 8, fontSize: 12, color: '#002B49', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Crear una tarea
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const client = clients.find((c) => c.id === task.clientId)
            const contact = client?.contacts.find((c) => c.id === task.contactId)
            return (
              <TaskCard
                key={task.id}
                task={task}
                clientName={client?.name ?? null}
                contactName={contact?.name ?? null}
                onComplete={handleComplete}
              />
            )
          })}
        </div>
      )}

      {showModal && (
        <CreateTaskForm
          onSubmit={handleCreateTask}
          onClose={() => { setShowModal(false); setCreateError(null) }}
          isLoading={isPending}
          error={createError}
        />
      )}
    </div>
  )
}
