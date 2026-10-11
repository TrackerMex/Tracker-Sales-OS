import { useQuery } from "@tanstack/react-query"
import { activitiesApi } from "../../infrastructure/activities.api"
import { useAppStore } from "@/shared/store/app.store"

export const useDailyActivities = (date?: string, sellerIdOverride?: string | null) => {
  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = sellerIdOverride !== undefined
    ? sellerIdOverride
    : currentUser?.sellerId

  return useQuery({
    queryKey: ['activities', 'daily', sellerId, date],
    queryFn: () => activitiesApi.getDailyActivities(sellerId!, date),
    enabled: !!sellerId,
  })
}
