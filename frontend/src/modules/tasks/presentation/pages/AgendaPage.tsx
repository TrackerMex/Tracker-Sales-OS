import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useClients } from '@/modules/clients/application/hooks/useClients'
import { useTodayTasks } from '../../application/hooks/useTodayTasks'
import { useCreateTask } from '../../application/hooks/useCreateTask'
import { useCompleteTask } from '../../application/hooks/useCompleteTask'
import { useUpdateTask } from '../../application/hooks/useUpdateTask'
import { useReactivateTask } from '../../application/hooks/useReactivateTask'
import { TaskCard } from '../components/TaskCard'
import { CreateTaskForm } from '../components/CreateTaskForm'
import { EditTaskForm } from '../components/EditTaskForm'
import type { CreateTaskInput, UpdateTaskInput, Task } from '../../domain/tasks.types'

export function AgendaPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useTodayTasks()
  const { mutate: createTask, isPending: isCreating, error: createError, reset: resetCreateTask } = useCreateTask()
  const { mutate: completeTask } = useCompleteTask()
  const { mutate: updateTask, isPending: isUpdating, error: updateError, reset: resetUpdateTask } = useUpdateTask()
  const { mutate: reactivateTask } = useReactivateTask()
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []
  const navigate = useNavigate()

  function handleComplete(taskId: string) {
    const task = tasks.find((t) => t.id === taskId)
    completeTask(taskId, {
      onSuccess: (completedTask) => {
        toast.success('Tarea completada')
        void navigate({
          to: '/actividades/nueva',
          search: {
            ...(completedTask.clientId ? { clientId: completedTask.clientId } : {}),
            ...(task?.title ? { taskTitle: task.title } : {}),
          },
        })
      },
      onError: () => toast.error('No se pudo completar la tarea'),
    })
  }

  function handleCreateTask(input: CreateTaskInput) {
    createTask(input, {
      onSuccess: () => {
        setShowCreateModal(false)
        toast.success('Tarea creada')
      },
      onError: () => toast.error('No se pudo crear la tarea'),
    })
  }

  function handleUpdateTask(input: UpdateTaskInput) {
    if (!editingTask) return
    updateTask({ taskId: editingTask.id, input }, {
      onSuccess: () => {
        setEditingTask(null)
        toast.success('Tarea actualizada')
      },
      onError: () => toast.error('No se pudo actualizar la tarea'),
    })
  }

  function handleReactivate(taskId: string) {
    reactivateTask(taskId, {
      onSuccess: () => toast.success('Tarea reactivada'),
      onError: () => toast.error('No se pudo reactivar la tarea'),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Compromisos comerciales</h1>
        <button onClick={() => { resetCreateTask(); setShowCreateModal(true) }} className="btn-primary">
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
            onClick={() => { resetCreateTask(); setShowCreateModal(true) }}
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
                onEdit={(t) => { resetUpdateTask(); setEditingTask(t) }}
                onReactivate={handleReactivate}
              />
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateTaskForm
          onSubmit={handleCreateTask}
          onClose={() => { setShowCreateModal(false); resetCreateTask() }}
          isLoading={isCreating}
          error={createError}
        />
      )}

      {editingTask && (
        <EditTaskForm
          task={editingTask}
          onSubmit={handleUpdateTask}
          onClose={() => { setEditingTask(null); resetUpdateTask() }}
          isLoading={isUpdating}
          error={updateError}
        />
      )}
    </div>
  )
}
