import { ID } from '../../../core/domain/types/common.types';
import { PipelineStage } from '../../clients/domain/clients.types';

export interface StageHistoryEntry {
  stage: PipelineStage;
  changedAt: string;
  changedBy: string;
}

export interface Deal {
  id: ID;
  clientId: ID;
  clientName: string;
  sellerId: ID;
  stage: PipelineStage;
  amount: number;
  probability: number;
  stageHistory: StageHistoryEntry[];
}
