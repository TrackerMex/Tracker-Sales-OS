import { useMutation, useQueryClient } from "@tanstack/react-query"
import { equipoApi } from "../../infrastructure/equipo.api"

export function useBlockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => equipoApi.blockUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })
}
