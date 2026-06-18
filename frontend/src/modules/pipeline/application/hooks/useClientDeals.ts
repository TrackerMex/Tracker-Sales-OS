import { useQuery } from "@tanstack/react-query"
import { pipelineApi } from "../../infrastructure/pipeline.api"

export function useClientDeals(clientId: string | null, sellerId: string | null) {
  return useQuery({
    queryKey: ["client-deals", clientId, sellerId],
    queryFn: () => pipelineApi.getClientDeals(clientId!, sellerId!),
    enabled: !!clientId && !!sellerId,
  })
}
