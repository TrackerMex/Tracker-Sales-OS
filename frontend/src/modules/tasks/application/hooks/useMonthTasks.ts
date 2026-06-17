import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/shared/store/app.store'
import { tasksApi } from '../../infrastructure/tasks.api'

export const useMonthTasks = (year: number, month: number) => {
  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`

  return useQuery({
    queryKey: ['tasks', 'month', sellerId, year, month],
    queryFn: () => tasksApi.getMonthTasks(sellerId, monthStart),
    enabled: !!sellerId,
    select: (tasks) =>
      tasks.filter((t) => {
        const d = new Date(t.scheduledAt)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      }),
  })
}
