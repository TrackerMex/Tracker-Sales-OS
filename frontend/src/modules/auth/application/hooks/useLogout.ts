import { useMutation } from "@tanstack/react-query"
import { authApi } from "../../infrastructure/auth.api"
import { useAppStore } from "../../../../shared/store/app.store"

export function useLogout() {
  const refreshToken = useAppStore((s) => s.refreshToken)
  const clearAuth = useAppStore((s) => s.clearAuth)

  return useMutation({
    mutationFn: async () => {
      const token = refreshToken ?? localStorage.getItem("refreshToken")
      if (token) {
        await authApi.logout(token)
      }
    },
    onSettled: () => {
      clearAuth()
    },
  })
}
