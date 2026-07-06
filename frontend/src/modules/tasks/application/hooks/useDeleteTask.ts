import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../infrastructure/tasks.api'

export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
