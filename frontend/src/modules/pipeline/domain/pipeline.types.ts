import type { ID } from "@/core/domain/types/common.types"
import type { PipelineStage } from "@/modules/clients/domain/clients.types"

export type { PipelineStage }

export type LossReason = 'precio' | 'competencia' | 'sin_respuesta' | 'timing' | 'otro'

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
