import { api } from "@/shared/lib/axios"
import type { Activity, CreateActivityInput, DailyActivitiesResponse } from "../domain/activities.types"
import type { PaginatedResponse } from "@/core/domain/types/api-response.types"

export const activitiesApi = {
  createActivity: (sellerId: string, input: CreateActivityInput): Promise<Activity> =>
    api.post('/activities', { ...input, sellerId }).then((r) => r.data),

  getDailyActivities: (sellerId: string, date?: string): Promise<DailyActivitiesResponse> =>
    api.get(`/activities/seller/${sellerId}/daily`, { params: date ? { date } : {} }).then((r) => r.data),

  getSellerActivities: (
    sellerId: string,
    params?: { page?: number; limit?: number; type?: string },
  ): Promise<PaginatedResponse<Activity>> =>
    api.get(`/activities/seller/${sellerId}`, { params }).then((r) => r.data),
}
