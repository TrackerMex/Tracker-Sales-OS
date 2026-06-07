import { api } from "@/shared/lib/axios"
import type { CoachingDaily } from "../domain/coaching.types"

export const coachingApi = {
  getDailyReport: async (sellerId: string): Promise<CoachingDaily> => {
    const res = await api.get<CoachingDaily>(
      `/coaching/seller/${sellerId}/daily`
    )
    return res.data
  },
}
