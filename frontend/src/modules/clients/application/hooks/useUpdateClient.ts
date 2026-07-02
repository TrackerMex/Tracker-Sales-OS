import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UpdateClientInput } from "../../domain/clients.types"
import { clientsApi } from "../../infrastructure/clients.api"

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClientInput }) =>
      clientsApi.updateClient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["pipeline"] })
    },
  })
}
