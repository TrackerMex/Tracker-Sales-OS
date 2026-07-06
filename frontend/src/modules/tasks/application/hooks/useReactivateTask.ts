import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../infrastructure/tasks.api'

export const useReactivateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.reactivateTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
