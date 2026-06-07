import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { ACTIVITY_REPOSITORY, IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { ActivityDto } from '../dtos/activity.dto';
import { GetActivitiesQueryDto } from '../dtos/get-activities-query.dto';

interface GetSellerInput extends GetActivitiesQueryDto { sellerId: string; }

@Injectable()
export class GetSellerActivitiesUseCase implements IUseCase<GetSellerInput, { data: ActivityDto[]; total: number }> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: IActivityRepository,
  ) {}

  async execute(input: GetSellerInput): Promise<{ data: ActivityDto[]; total: number }> {
    const where: Record<string, unknown> = { sellerId: input.sellerId };
    if (input.type) where.type = input.type;
    if (input.result) where.result = input.result;

    const { data, total } = await this.activityRepo.findAll({
      page: input.page ?? 1,
      limit: input.limit ?? 20,
      where,
    });

    return { data: data.map(ActivityDto.fromEntity), total };
  }
}
