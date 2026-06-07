import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { ACTIVITY_REPOSITORY, IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { ActivityDto } from '../dtos/activity.dto';

export interface GetDailyInput { sellerId: string; date?: string; }
export interface GetDailyOutput { activities: ActivityDto[]; totalPoints: number; }

@Injectable()
export class GetDailyActivitiesUseCase implements IUseCase<GetDailyInput, GetDailyOutput> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: IActivityRepository,
  ) {}

  async execute(input: GetDailyInput): Promise<GetDailyOutput> {
    const date = input.date ? new Date(input.date) : new Date();
    const [activities, totalPoints] = await Promise.all([
      this.activityRepo.findDailyBySeller(input.sellerId, date),
      this.activityRepo.sumDailyPoints(input.sellerId, date),
    ]);
    return {
      activities: activities.map(ActivityDto.fromEntity),
      totalPoints,
    };
  }
}
