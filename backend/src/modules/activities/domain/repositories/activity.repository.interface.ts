import { IRepository } from '../../../../core/domain/repository.interface';
import { ActivityEntity } from '../entities/activity.entity';

export const ACTIVITY_REPOSITORY = 'ACTIVITY_REPOSITORY';

export interface IActivityRepository extends IRepository<ActivityEntity> {
  findDailyBySeller(sellerId: string, date: Date): Promise<ActivityEntity[]>;
  sumDailyPoints(sellerId: string, date: Date): Promise<number>;
  findRecentBySeller(sellerId: string, limit: number): Promise<ActivityEntity[]>;
}
