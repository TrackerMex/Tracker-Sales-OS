import { ActivityEntity, ActivityType, ActivityResult } from '../../domain/entities/activity.entity';

export class ActivityDto {
  id: string;
  sellerId: string;
  clientId: string | null;
  contactId: string | null;
  type: ActivityType;
  result: ActivityResult;
  summary: string;
  discovery: string | null;
  agreement: string | null;
  nextStep: string | null;
  nextObjective: string | null;
  nextDate: string | null;
  nextTime: string | null;
  points: number;
  quality: number;
  executedAt: Date;
  programmedAt: Date | null;
  capturedAt: Date;
  delayMinutes: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: ActivityEntity): ActivityDto {
    const dto = new ActivityDto();
    dto.id = entity.id;
    dto.sellerId = entity.sellerId;
    dto.clientId = entity.clientId;
    dto.contactId = entity.contactId;
    dto.type = entity.type;
    dto.result = entity.result;
    dto.summary = entity.summary;
    dto.discovery = entity.discovery;
    dto.agreement = entity.agreement;
    dto.nextStep = entity.nextStep;
    dto.nextObjective = entity.nextObjective;
    dto.nextDate = entity.nextDate;
    dto.nextTime = entity.nextTime;
    dto.points = entity.points;
    dto.quality = entity.quality;
    dto.executedAt = entity.executedAt;
    dto.programmedAt = entity.programmedAt;
    dto.capturedAt = entity.capturedAt;
    dto.delayMinutes = entity.delayMinutes;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
