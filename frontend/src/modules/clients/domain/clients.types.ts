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

export interface Contact {
  id: ID
  name: string
  role: string
  phone: string
  email: string
  isDecisionMaker: boolean
}

export interface Client {
  id: ID
  name: string
  domain: string | null
  type: ClientType
  person: PersonType
  sellerId: ID
  stage: PipelineStage
  expectedAmount: number
  units: number
  pain: string | null
  provider: string | null
  nextStep: string | null
  nextDate: string | null
  contacts: Contact[]
  createdAt: string
}
