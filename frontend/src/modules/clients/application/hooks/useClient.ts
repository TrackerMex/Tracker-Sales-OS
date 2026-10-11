import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/shared/store/app.store"
import { clientsApi } from "../../infrastructure/clients.api"

export function useClient(clientId: string | null) {
  const currentUser = useAppStore((s) => s.currentUser)
  return useQuery({
    queryKey: ["clients", "detail", clientId, currentUser?.id],
    queryFn: () => clientsApi.getClient(clientId!),
    enabled: !!clientId && !!currentUser,
    retry: false,
  })
}
