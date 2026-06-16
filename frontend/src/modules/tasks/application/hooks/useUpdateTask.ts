import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/shared/store/app.store'
import { tasksApi } from '../../infrastructure/tasks.api'
import type { UpdateTaskInput } from '../../domain/tasks.types'

export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  const currentUser = useAppStore((s) => s.currentUser)

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => {
      const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''
      return tasksApi.updateTask(taskId, sellerId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
