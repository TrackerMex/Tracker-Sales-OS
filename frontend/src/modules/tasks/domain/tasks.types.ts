import { ID } from '../../../core/domain/types/common.types';
import { ActivityType } from '../../../shared/lib/constants';

export interface Task {
  id: ID;
  sellerId: ID;
  clientId: ID;
  type: ActivityType;
  objective: string;
  scheduledAt: string;
  completed: boolean;
  completedAt: string | null;
  aiSuggestion: string | null;
}
