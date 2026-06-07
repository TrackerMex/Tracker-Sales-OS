import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { authApi } from "../../infrastructure/auth.api"
import { useAppStore } from "../../../../shared/store/app.store"
import type { LoginRequest } from "../../domain/auth.types"

export function useLogin() {
  const router = useRouter()
  const setAuth = useAppStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (dto: LoginRequest) => authApi.login(dto),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      router.navigate({ to: "/dashboard" })
    },
  })
}
