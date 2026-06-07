import { useMutation, useQueryClient } from "@tanstack/react-query"
import { equipoApi, type CreateSellerInput } from "../../infrastructure/equipo.api"

export function useCreateSeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSellerInput) => equipoApi.createSeller(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers"] }),
  })
}
