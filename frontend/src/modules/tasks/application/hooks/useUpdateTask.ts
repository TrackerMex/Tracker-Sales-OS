import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../infrastructure/tasks.api'
import type { UpdateTaskInput } from '../../domain/tasks.types'

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      tasksApi.updateTask(taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
