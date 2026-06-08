import { api } from "../../../shared/lib/axios"
import type {
  Client,
  ClientFilters,
  CreateClientInput,
  CreateContactInput,
  PaginatedClients,
  UpdateClientInput,
} from "../domain/clients.types"

function cleanParams(filters: ClientFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  )
}

export const clientsApi = {
  getClients: (filters: ClientFilters = {}): Promise<PaginatedClients> =>
    api.get("/clients", { params: cleanParams(filters) }).then((r) => r.data),

  createClient: (payload: CreateClientInput): Promise<Client> =>
    api.post("/clients", payload).then((r) => r.data),

  updateClient: (id: string, payload: UpdateClientInput): Promise<Client> =>
    api.patch(`/clients/${id}`, payload).then((r) => r.data),

  addContact: (clientId: string, payload: CreateContactInput): Promise<Client> =>
    api.post(`/clients/${clientId}/contacts`, payload).then((r) => r.data),

  deleteClient: (id: string): Promise<void> =>
    api.delete(`/clients/${id}`).then(() => undefined),
}
