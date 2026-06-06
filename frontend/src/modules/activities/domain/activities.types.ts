import { ID } from '../../../core/domain/types/common.types';
import { ActivityType } from '../../../shared/lib/constants';

export type ActivityResult =
  | 'Interesado'
  | 'No contestó'
  | 'Solicita propuesta'
  | 'Solicita reunión'
  | 'Negociación'
  | 'Cierre ganado'
  | 'Cierre perdido'
  | 'Información enviada';

export interface Activity {
  id: ID;
  sellerId: ID;
  clientId: ID;
  type: ActivityType;
  result: ActivityResult;
  summary: string;
  discovery: string | null;
  agreement: string | null;
  nextStep: string | null;
  nextDate: string | null;
  points: number;
  quality: number;
  executedAt: string;
  capturedAt: string;
  delayMinutes: number;
}

export interface CreateActivityDto {
  clientId: ID;
  contactId?: ID;
  type: ActivityType;
  result: ActivityResult;
  summary: string;
  discovery?: string;
  agreement?: string;
  nextStep?: string;
  nextDate?: string;
  nextTime?: string;
  executedAt: string;
  programmedAt?: string;
}
