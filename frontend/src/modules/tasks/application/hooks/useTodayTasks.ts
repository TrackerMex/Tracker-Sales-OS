import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/shared/store/app.store'
import { tasksApi } from '../../infrastructure/tasks.api'

export const useTodayTasks = (date?: string) => {
  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''

  return useQuery({
    queryKey: ['tasks', 'today', sellerId, date],
    queryFn: () => tasksApi.getTodayTasks(sellerId, date),
    enabled: !!sellerId,
  })
}
