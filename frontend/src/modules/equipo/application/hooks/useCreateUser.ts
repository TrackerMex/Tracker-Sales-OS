import { useMutation, useQueryClient } from "@tanstack/react-query"
import { equipoApi, type CreateUserInput } from "../../infrastructure/equipo.api"

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => equipoApi.createUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })
}
