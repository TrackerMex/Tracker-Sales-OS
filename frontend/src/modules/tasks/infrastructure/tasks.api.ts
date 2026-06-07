import { api } from '@/shared/lib/axios'
import type { Task, CreateTaskInput } from '../domain/tasks.types'

export const tasksApi = {
  createTask: (sellerId: string, input: CreateTaskInput): Promise<Task> =>
    api.post<Task>('/tasks', { ...input, sellerId }).then((r) => r.data),

  getTodayTasks: (sellerId: string, date?: string): Promise<Task[]> =>
    api.get<Task[]>(`/tasks/seller/${sellerId}/today`, { params: date ? { date } : {} }).then((r) => r.data),

  completeTask: (taskId: string, sellerId: string): Promise<Task> =>
    api.patch<Task>(`/tasks/${taskId}/complete`, { sellerId }).then((r) => r.data),
}
