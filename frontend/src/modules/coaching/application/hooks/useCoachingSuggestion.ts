import { useMutation } from "@tanstack/react-query"
import { coachingApi } from "../../infrastructure/coaching.api"

export function useCoachingSuggestion() {
  return useMutation({ mutationFn: coachingApi.getSuggestion })
}
