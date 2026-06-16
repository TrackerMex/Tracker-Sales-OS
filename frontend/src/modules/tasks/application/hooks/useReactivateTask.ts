import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/shared/store/app.store'
import { tasksApi } from '../../infrastructure/tasks.api'

export const useReactivateTask = () => {
  const queryClient = useQueryClient()
  const currentUser = useAppStore((s) => s.currentUser)

  return useMutation({
    mutationFn: (taskId: string) => {
      const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''
      return tasksApi.reactivateTask(taskId, sellerId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
