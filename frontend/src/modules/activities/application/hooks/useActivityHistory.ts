import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activitiesApi } from '../../infrastructure/activities.api'

export function useActivityById(id: string | null) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => activitiesApi.getActivityById(id!),
    enabled: !!id,
  })
}

export function useUpdateActivityStatus(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { newStatus: string; comment?: string }) =>
      activitiesApi.updateActivityStatus(activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
