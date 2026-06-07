import { api } from "../../../shared/lib/axios"
import type { LoginRequest, LoginResponse } from "../domain/auth.types"

export const authApi = {
  login: (dto: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", dto).then((r) => r.data),
}
