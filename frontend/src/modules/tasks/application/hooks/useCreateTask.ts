import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/shared/store/app.store'
import { tasksApi } from '../../infrastructure/tasks.api'
import type { CreateTaskInput } from '../../domain/tasks.types'
import { UserRole } from '@/core/domain/types/common.types'

export const useCreateTask = () => {
  const queryClient = useQueryClient()
  const currentUser = useAppStore((s) => s.currentUser)

  return useMutation({
    mutationFn: (input: CreateTaskInput) => {
      const sellerId = currentUser?.role === UserRole.Seller
        ? currentUser.sellerId
        : input.sellerId
      if (!sellerId) throw new Error('Selecciona un vendedor activo.')
      return tasksApi.createTask(sellerId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
