import { api } from "@/shared/lib/axios"
import type { MiDia } from "../domain/mi-dia.types"

export const miDiaApi = {
  getMiDia: async (sellerId: string): Promise<MiDia> => {
    const res = await api.get<MiDia>(`/dashboard/mi-dia/seller/${sellerId}`)
    return res.data
  },
}
