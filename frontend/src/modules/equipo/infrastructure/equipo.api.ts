import { api } from "../../../shared/lib/axios"
import type {
  EquipoSeller,
  EquipoUser,
  PaginatedUsers,
} from "../domain/equipo.types"

export const equipoApi = {
  getUsers: (page = 1, limit = 20): Promise<PaginatedUsers> =>
    api.get("/users", { params: { page, limit } }).then((r) => r.data),

  getSellers: (): Promise<EquipoSeller[]> =>
    api.get("/sellers").then((r) => r.data),

  blockUser: (id: string): Promise<EquipoUser> =>
    api.patch(`/users/${id}/block`).then((r) => r.data),
}
