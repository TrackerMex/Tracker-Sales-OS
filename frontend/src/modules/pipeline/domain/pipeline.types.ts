import type { ID } from "@/core/domain/types/common.types"
import type { PipelineStage } from "@/modules/clients/domain/clients.types"

export type { PipelineStage }

export interface StageHistoryEntry {
  stage: PipelineStage
  changedAt: string
  changedBy: string
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
  contactName?: string
  contactRole?: string
  painPoint?: string
  sellerName?: string
  nextStep?: string
  nextDate?: string
  nextTime?: string
}

export interface CreateDealInput {
  clientId: string
  sellerId: string
  amount?: number
  stage?: PipelineStage
}

export interface ChangeStageInput {
  newStage: PipelineStage
  changedBy: string
}

export type PipelineGrouped = Record<PipelineStage, Deal[]>
