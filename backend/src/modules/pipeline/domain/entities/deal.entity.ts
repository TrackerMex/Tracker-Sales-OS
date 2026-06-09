import { BaseEntity } from '../../../../core/domain/base.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export interface StageHistoryEntry {
  stage: PipelineStage;
  changedAt: string;
  changedBy: string;
}

export const STAGE_PROBABILITY: Record<PipelineStage, number> = {
  [PipelineStage.Prospecto]: 5,
  [PipelineStage.Contactado]: 15,
  [PipelineStage.Interesado]: 30,
  [PipelineStage.Propuesta]: 50,
  [PipelineStage.Negociacion]: 70,
  [PipelineStage.Cierre]: 90,
  [PipelineStage.Perdido]: 0,
};

export const ALLOWED_TRANSITIONS: Partial<Record<PipelineStage, PipelineStage[]>> = {
  [PipelineStage.Prospecto]: [PipelineStage.Contactado, PipelineStage.Perdido],
  [PipelineStage.Contactado]: [PipelineStage.Interesado, PipelineStage.Perdido],
  [PipelineStage.Interesado]: [PipelineStage.Propuesta, PipelineStage.Perdido],
  [PipelineStage.Propuesta]: [PipelineStage.Negociacion, PipelineStage.Perdido],
  [PipelineStage.Negociacion]: [PipelineStage.Cierre, PipelineStage.Perdido],
  [PipelineStage.Cierre]: [],
  [PipelineStage.Perdido]: [],
};

export class DealEntity extends BaseEntity {
  clientId: string;
  clientName: string;
  sellerId: string;
  stage: PipelineStage;
  amount: number;
  probability: number;
  stageHistory: StageHistoryEntry[];
}
