import type { ID } from "@/core/domain/types/common.types"

export type ClientType = "Nuevo" | "Existente" | "Prospecto"
export type PersonType = "Moral" | "Física"
export type PipelineStage =
  | "Prospecto"
  | "Contactado"
  | "Interesado"
  | "Propuesta"
  | "Negociación"
  | "Cierre"
  | "Perdido"
export type ClientSource =
  | "Prospección propia"
  | "Cliente existente"
  | "Referido"
  | "Expo"
  | "Marketing"
  | "LinkedIn"
  | "Web"
  | "Dirección Comercial"

export interface Contact {
  id: ID
  clientId: ID
  name: string
  role: string
  phone: string
  email: string
  isDecisionMaker: boolean
  createdAt: string
}

export interface Client {
  id: ID
  name: string
  domain: string | null
  type: ClientType
  person: PersonType
  sellerId: ID
  source: ClientSource
  stage: PipelineStage
  expectedAmount: number
  units: number
  pain: string | null
  provider: string | null
  nextStep: string | null
  nextDate: string | null
  nextTime: string | null
  contacts: Contact[]
  createdAt: string
  lastActivityAt: string | null
  isCold: boolean
  dataQuality: number
}

export interface PaginatedClients {
  data: Client[]
  total: number
}

export interface ClientFilters {
  stage?: PipelineStage
  type?: ClientType
  seller?: ID
  q?: string
  page?: number
  limit?: number
  cold?: boolean
  incomplete?: boolean
}

export interface CreateContactInput {
  name: string
  role?: string
  phone?: string
  email?: string
  isDecisionMaker?: boolean
}

export interface CreateClientInput {
  name: string
  domain?: string
  type: ClientType
  person: PersonType
  sellerId?: ID
  source: ClientSource
  stage?: PipelineStage
  expectedAmount?: number
  units?: number
  pain?: string
  provider?: string
  nextStep?: string
  nextDate?: string
  nextTime?: string
  contacts?: CreateContactInput[]
}

export interface UpdateClientInput {
  name?: string
  domain?: string
  type?: ClientType
  person?: PersonType
  sellerId?: ID
  source?: ClientSource
  stage?: PipelineStage
  expectedAmount?: number
  units?: number
  pain?: string
  provider?: string
  nextStep?: string
  nextDate?: string
  nextTime?: string
}
