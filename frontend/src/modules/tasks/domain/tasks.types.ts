export type TaskStatus = 'Pendiente' | 'Completado'

export interface Task {
  id: string
  sellerId: string
  clientId: string | null
  type: string | null
  contactId: string | null
  title: string
  description: string | null
  scheduledAt: string
  completedAt: string | null
  status: TaskStatus
  isOverdue: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  clientId?: string
  type?: string
  contactId?: string
  title: string
  description?: string
  scheduledAt: string
}

export interface UpdateTaskInput {
  clientId?: string
  type?: string
  contactId?: string
  title?: string
  description?: string
  scheduledAt?: string
}
