import { useMutation, useQueryClient } from "@tanstack/react-query"
import { activitiesApi } from "../../infrastructure/activities.api"
import { useAppStore } from "@/shared/store/app.store"
import type { CreateActivityInput } from "../../domain/activities.types"

export const useCreateActivity = () => {
  const queryClient = useQueryClient()
  const currentUser = useAppStore((s) => s.currentUser)

  return useMutation({
    mutationFn: (input: CreateActivityInput) => {
      const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''
      return activitiesApi.createActivity(sellerId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
  })
}
