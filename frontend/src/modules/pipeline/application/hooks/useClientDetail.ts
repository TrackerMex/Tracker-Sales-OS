import { useQuery } from "@tanstack/react-query"
import { useClient } from "@/modules/clients/application/hooks/useClient"
import { activitiesApi } from "@/modules/activities/infrastructure/activities.api"
import type { Deal } from "../../domain/pipeline.types"

export function useClientDetail(deal: Deal) {
  const clientQuery = useClient(deal.clientId ?? null)
  const activitiesQuery = useQuery({
    queryKey: ["activities", "client", deal.clientId, deal.sellerId],
    queryFn: () => activitiesApi.getClientActivities(deal.clientId!),
    enabled: !!deal.clientId && clientQuery.isSuccess,
  })

  return {
    clientQuery,
    activities: clientQuery.isSuccess
      ? (activitiesQuery.data ?? []).filter((a) => a.sellerId === deal.sellerId)
      : [],
  }
}
