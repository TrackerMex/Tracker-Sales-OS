import type { ID } from "@/core/domain/types/common.types"
import type { ActivityType, PipelineStage } from "@/shared/lib/constants"

export type ActivityStatus = 'Pendiente' | 'En curso' | 'Completada' | 'Cancelada'

export interface ActivityHistoryEntry {
  changedAt: string
  oldStatus: string
  newStatus: string
  changedBy: string
  comment?: string
}

export type ActivityResult =
  | "Interesado"
  | "No contestó"
  | "Solicita propuesta"
  | "Solicita reunión"
  | "Negociación"
  | "Cierre ganado"
  | "Cierre perdido"
  | "Información enviada"

export interface Activity {
  id: ID
  sellerId: ID
  clientId: ID | null
  contactId: ID | null
  type: ActivityType
  result: ActivityResult
  summary: string
  discovery: string | null
  agreement: string | null
  nextStep: string | null
  nextObjective: string | null
  nextDate: string | null
  nextTime: string | null
  points: number
  quality: number
  stage?: string | null
  taskId?: string | null
  clientName?: string | null
  contactName?: string | null
  taskTitle?: string | null
  status?: ActivityStatus
  activityHistory?: ActivityHistoryEntry[]
  executedAt: string
  capturedAt: string
  delayMinutes: number
  createdAt: string
}

export interface DailyActivitiesResponse {
  activities: Activity[]
  totalPoints: number
}

export interface CreateActivityInput {
  clientId?: ID
  contactId?: ID
  taskId?: string
  type: ActivityType
  result: ActivityResult
  summary: string
  discovery?: string
  agreement?: string
  nextStep?: string
  nextObjective?: string
  nextDate?: string
  nextTime?: string
  executedAt: string
  programmedAt?: string
  stage?: PipelineStage
  opportunityName?: string
}
