import { useMutation, useQueryClient } from "@tanstack/react-query"
import { equipoApi } from "../../infrastructure/equipo.api"

export function useDeactivateSeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => equipoApi.deactivateSeller(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers"] }),
  })
}
