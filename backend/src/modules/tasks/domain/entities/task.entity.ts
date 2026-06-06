import { BaseEntity } from '../../../../core/domain/base.entity';
import { ActivityType } from '../../activities/domain/entities/activity.entity';

export class TaskEntity extends BaseEntity {
  sellerId: string;
  clientId: string;
  type: ActivityType;
  objective: string;
  scheduledAt: Date;
  completed: boolean;
  completedAt: Date | null;
  aiSuggestion: string | null;
  sourceActivityId: string | null;
}
