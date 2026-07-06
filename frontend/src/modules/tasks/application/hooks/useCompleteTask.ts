import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../infrastructure/tasks.api'

export const useCompleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
