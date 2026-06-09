import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/shared/store/app.store'
import { tasksApi } from '../../infrastructure/tasks.api'

function localDateISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const useTodayTasks = (date?: string) => {
  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''
  const localDate = date ?? localDateISO()

  return useQuery({
    queryKey: ['tasks', 'today', sellerId, localDate],
    queryFn: () => tasksApi.getTodayTasks(sellerId, localDate),
    enabled: !!sellerId,
  })
}
