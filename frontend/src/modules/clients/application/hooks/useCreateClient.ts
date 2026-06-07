import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateClientInput } from "../../domain/clients.types"
import { clientsApi } from "../../infrastructure/clients.api"

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClientInput) => clientsApi.createClient(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  })
}
