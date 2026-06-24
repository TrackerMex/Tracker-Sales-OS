import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '../../infrastructure/tasks.api'

export const useTeamMonthTasks = (year: number, month: number, enabled = true) => {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`

  return useQuery({
    queryKey: ['tasks', 'month', 'team', year, month],
    queryFn: () => tasksApi.getMonthTeamTasks(monthStart),
    enabled,
    select: (tasks) =>
      tasks.filter((t) => {
        const d = new Date(t.scheduledAt)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      }),
  })
}
