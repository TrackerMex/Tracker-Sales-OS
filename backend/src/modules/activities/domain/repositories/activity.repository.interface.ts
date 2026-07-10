import { IRepository } from '../../../../core/domain/repository.interface';
import { ActivityEntity, ActivityHistoryEntry } from '../entities/activity.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export const ACTIVITY_REPOSITORY = 'ACTIVITY_REPOSITORY';

export interface PipelineDealSeed {
  clientId: string;
  clientName: string;
  sellerId: string;
  stage: PipelineStage;
  amount: number;
  probability: number;
  opportunityName: string | null;
}

export interface IActivityRepository extends IRepository<ActivityEntity> {
  findDailyBySeller(sellerId: string, date: Date): Promise<ActivityEntity[]>;
  sumDailyPoints(sellerId: string, date: Date): Promise<number>;
  findRecentBySeller(sellerId: string, limit: number): Promise<ActivityEntity[]>;
  sumPointsByDayForSellers(
    from: Date,
    to: Date,
  ): Promise<{ sellerId: string; day: string; points: number }[]>;
  updateStatus(id: string, status: string, historyEntry: ActivityHistoryEntry): Promise<ActivityEntity>;
  findByClientId(clientId: string): Promise<ActivityEntity[]>;
  createWithPipelineSync(
    activity: Partial<ActivityEntity>,
    deal: PipelineDealSeed,
  ): Promise<ActivityEntity>;
  createAndTouchDeal(
    activity: Partial<ActivityEntity>,
    dealId: string,
  ): Promise<ActivityEntity>;
}
