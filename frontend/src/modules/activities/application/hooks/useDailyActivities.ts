import { useQuery } from "@tanstack/react-query"
import { activitiesApi } from "../../infrastructure/activities.api"
import { useAppStore } from "@/shared/store/app.store"

export const useDailyActivities = (date?: string) => {
  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''

  return useQuery({
    queryKey: ['activities', 'daily', sellerId, date],
    queryFn: () => activitiesApi.getDailyActivities(sellerId, date),
    enabled: !!sellerId,
  })
}
