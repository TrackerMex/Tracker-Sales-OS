import { api } from "@/shared/lib/axios"
import type { CoachingDaily } from "../domain/coaching.types"

export const coachingApi = {
  getDailyReport: async (sellerId: string): Promise<CoachingDaily> => {
    const res = await api.get<CoachingDaily>(
      `/coaching/seller/${sellerId}/daily`
    )
    return res.data
  },

  getSuggestion: async (dto: {
    type: string;
    objective?: string;
    client?: string;
    dealStage?: string;
    contactName?: string;
  }): Promise<{ tips: string[]; source: string }> => {
    const res = await api.post<{ tips: string[]; source: string }>('/coaching/suggestion', dto);
    return res.data;
  },
}
