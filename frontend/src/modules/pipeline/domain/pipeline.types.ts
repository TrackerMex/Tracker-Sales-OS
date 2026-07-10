import type { ID } from "@/core/domain/types/common.types"
import type { PipelineStage } from "@/modules/clients/domain/clients.types"

export type { PipelineStage }

export type LossReason =
  | "precio"
  | "competencia"
  | "sin_respuesta"
  | "timing"
  | "otro"

// Mirrors ALLOWED_TRANSITIONS in backend deal.entity.ts
export const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  Prospecto: [
    "Contactado",
    "Interesado",
    "Propuesta",
    "Negociación",
    "Cierre",
    "Perdido",
  ],
  Contactado: [
    "Prospecto",
    "Interesado",
    "Propuesta",
    "Negociación",
    "Cierre",
    "Perdido",
  ],
  Interesado: [
    "Prospecto",
    "Contactado",
    "Propuesta",
    "Negociación",
    "Cierre",
    "Perdido",
  ],
  Propuesta: [
    "Prospecto",
    "Contactado",
    "Interesado",
    "Negociación",
    "Cierre",
    "Perdido",
  ],
  Negociación: [
    "Prospecto",
    "Contactado",
    "Interesado",
    "Propuesta",
    "Cierre",
    "Perdido",
  ],
  Cierre: [
    "Prospecto",
    "Contactado",
    "Interesado",
    "Propuesta",
    "Negociación",
    "Perdido",
  ],
  Perdido: [
    "Prospecto",
    "Contactado",
    "Interesado",
    "Propuesta",
    "Negociación",
    "Cierre",
  ],
}

export interface StageHistoryEntry {
  stage: PipelineStage
  changedAt: string
  changedBy: string
  lossReason?: LossReason
}

export interface Deal {
  id: ID
  clientId: ID
  clientName: string
  sellerId: ID
  stage: PipelineStage
  amount: number
  probability: number
  stageHistory: StageHistoryEntry[]
  opportunityName: string | null
  contactName?: string
  contactRole?: string
  painPoint?: string
  sellerName?: string
  nextStep?: string
  nextDate?: string
  nextTime?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateDealInput {
  clientId: string
  sellerId: string
  amount?: number
  stage?: PipelineStage
  opportunityName?: string
}

export interface ChangeStageInput {
  newStage: PipelineStage
  changedBy: string
  lossReason?: LossReason
}

export type PipelineGrouped = Record<PipelineStage, Deal[]>
