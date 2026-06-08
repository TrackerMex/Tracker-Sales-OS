import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clientsApi } from "../../infrastructure/clients.api"

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsApi.deleteClient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  })
}
