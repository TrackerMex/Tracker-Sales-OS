import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "../../infrastructure/dashboard.api"

export const useStalledDeals = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["dashboard", "stalled-deals", page, limit],
    queryFn: () => dashboardApi.getStalledDeals(page, limit),
  })
}
