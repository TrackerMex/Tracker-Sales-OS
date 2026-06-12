import {
  DealEntity,
  StageHistoryEntry,
} from '../../domain/entities/deal.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export class DealDto {
  id: string;
  clientId: string;
  clientName: string;
  sellerId: string;
  stage: PipelineStage;
  amount: number;
  probability: number;
  stageHistory: StageHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  contactName: string | null;
  contactRole: string | null;
  painPoint: string | null;
  sellerName: string | null;
  nextStep: string | null;
  nextDate: string | null;
  nextTime: string | null;

  static fromEntity(entity: DealEntity): DealDto {
    const dto = new DealDto();
    dto.id = entity.id;
    dto.clientId = entity.clientId;
    dto.clientName = entity.clientName;
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

  static fromEnrichedRow(row: {
    deal: DealEntity;
    clientName?: string;
    contactName?: string | null;
    contactRole?: string | null;
    painPoint?: string | null;
    sellerName?: string | null;
    clientNextStep?: string | null;
    clientNextDate?: string | null;
    clientNextTime?: string | null;
  }): DealDto {
    const dto = DealDto.fromEntity(row.deal);
    dto.clientName = row.clientName ?? row.deal.clientName;
    dto.contactName = row.contactName ?? null;
    dto.contactRole = row.contactRole ?? null;
    dto.painPoint = row.painPoint ?? null;
    dto.sellerName = row.sellerName ?? null;
    dto.nextStep = row.clientNextStep ?? null;
    dto.nextDate = row.clientNextDate ?? null;
    dto.nextTime = row.clientNextTime ?? null;
    return dto;
  }
}
