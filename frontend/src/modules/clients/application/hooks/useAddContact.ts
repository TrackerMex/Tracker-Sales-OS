import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateContactInput } from "../../domain/clients.types"
import { clientsApi } from "../../infrastructure/clients.api"

export function useAddContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: CreateContactInput }) =>
      clientsApi.addContact(clientId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  })
}
