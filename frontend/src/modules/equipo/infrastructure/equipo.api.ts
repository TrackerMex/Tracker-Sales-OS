import { api } from "../../../shared/lib/axios"
import type {
  EquipoSeller,
  EquipoUser,
  PaginatedUsers,
} from "../domain/equipo.types"

export interface CreateSellerInput {
  name: string
  profile?: string
}

export interface CreateUserInput {
  username: string
  password: string
  name: string
  role: string
  sellerId?: string
}

export const equipoApi = {
  getUsers: (page = 1, limit = 20): Promise<PaginatedUsers> =>
    api.get("/users", { params: { page, limit } }).then((r) => r.data),

  getSellers: (): Promise<EquipoSeller[]> =>
    api.get("/sellers").then((r) => r.data),

  blockUser: (id: string): Promise<EquipoUser> =>
    api.patch(`/users/${id}/block`).then((r) => r.data),

  createSeller: (input: CreateSellerInput): Promise<EquipoSeller> =>
    api.post("/sellers", input).then((r) => r.data),

  createUser: (input: CreateUserInput): Promise<EquipoUser> =>
    api.post("/users", input).then((r) => r.data),

  deactivateSeller: (id: string): Promise<EquipoSeller> =>
    api.patch(`/sellers/${id}/deactivate`).then((r) => r.data),
}
