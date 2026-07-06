import { api } from '@/shared/lib/axios'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../domain/tasks.types'

export const tasksApi = {
  createTask: (sellerId: string, input: CreateTaskInput): Promise<Task> =>
    api.post<Task>('/tasks', { ...input, sellerId }).then((r) => r.data),

  getTodayTasks: (sellerId: string, date?: string): Promise<Task[]> =>
    api.get<Task[]>(`/tasks/seller/${sellerId}/today`, { params: date ? { date } : {} }).then((r) => r.data),

  getMonthTasks: (sellerId: string, monthStart: string): Promise<Task[]> =>
    api.get<Task[]>(`/tasks/seller/${sellerId}/today`, { params: { date: monthStart } }).then((r) => r.data),

  getMonthTeamTasks: (monthStart: string): Promise<Task[]> =>
    api.get<Task[]>('/tasks/team', { params: { date: monthStart } }).then((r) => r.data),

  completeTask: (taskId: string): Promise<Task> =>
    api.patch<Task>(`/tasks/${taskId}/complete`, {}).then((r) => r.data),

  updateTask: (taskId: string, input: UpdateTaskInput): Promise<Task> =>
    api.patch<Task>(`/tasks/${taskId}`, input).then((r) => r.data),

  reactivateTask: (taskId: string): Promise<Task> =>
    api.patch<Task>(`/tasks/${taskId}/reactivate`, {}).then((r) => r.data),

  deleteTask: (taskId: string): Promise<void> =>
    api.delete(`/tasks/${taskId}`).then(() => undefined),
}
