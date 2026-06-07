import {
  DealEntity,
  StageHistoryEntry,
} from '../../domain/entities/deal.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export class DealDto {
  id: string;
  clientId: string;
  sellerId: string;
  stage: PipelineStage;
  amount: number;
  probability: number;
  stageHistory: StageHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  static fromEntity(entity: DealEntity): DealDto {
    const dto = new DealDto();
    dto.id = entity.id;
    dto.clientId = entity.clientId;
    dto.sellerId = entity.sellerId;
    dto.stage = entity.stage;
    dto.amount = entity.amount;
    dto.probability = entity.probability;
    dto.stageHistory = entity.stageHistory;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.deletedAt = entity.deletedAt;
    return dto;
  }
}
