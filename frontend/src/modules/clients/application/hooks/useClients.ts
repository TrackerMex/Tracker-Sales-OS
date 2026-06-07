import { useQuery } from "@tanstack/react-query"
import type { ClientFilters } from "../../domain/clients.types"
import { clientsApi } from "../../infrastructure/clients.api"

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ["clients", filters],
    queryFn: () => clientsApi.getClients(filters),
  })
}
