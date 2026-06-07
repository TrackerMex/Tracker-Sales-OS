import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/shared/store/app.store'
import { tasksApi } from '../../infrastructure/tasks.api'
import type { CreateTaskInput } from '../../domain/tasks.types'

export const useCreateTask = () => {
  const queryClient = useQueryClient()
  const currentUser = useAppStore((s) => s.currentUser)

  return useMutation({
    mutationFn: (input: CreateTaskInput) => {
      const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''
      return tasksApi.createTask(sellerId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
