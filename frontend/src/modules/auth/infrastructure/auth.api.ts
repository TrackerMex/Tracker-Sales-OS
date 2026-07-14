import { api } from "../../../shared/lib/axios"
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
} from "../domain/auth.types"

export const authApi = {
  login: (dto: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", dto).then((r) => r.data),
  refresh: (refreshToken: string) =>
    api
      .post<RefreshResponse>("/auth/refresh", { refreshToken })
      .then((r) => r.data),
  logout: (refreshToken: string) =>
    api.post<void>("/auth/logout", { refreshToken }).then((r) => r.data),
}
