import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, LessThan } from 'typeorm';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { TaskTypeormEntity } from '../../../tasks/infrastructure/entities/task.typeorm.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { TaskStatus } from '../../../tasks/domain/entities/task.entity';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { SellerScoreDto } from '../dtos/seller-score.dto';

@Injectable()
export class GetSellersScoreUseCase implements IUseCase<
  void,
  SellerScoreDto[]
> {
  constructor(
    @InjectRepository(ActivityTypeormEntity)
    private activityRepo: Repository<ActivityTypeormEntity>,
    @InjectRepository(TaskTypeormEntity)
    private taskRepo: Repository<TaskTypeormEntity>,
    @InjectRepository(SellerTypeormEntity)
    private sellerRepo: Repository<SellerTypeormEntity>,
  ) {}

  async execute(): Promise<SellerScoreDto[]> {
    const sellers = await this.sellerRepo.find({
      where: { active: true, deletedAt: IsNull() },
    });

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const results = await Promise.all(
      sellers.map(async (seller) => {
        const [todayActivities, monthlyRaw, overdueTasks] = await Promise.all([
          this.activityRepo.find({
            where: {
              sellerId: seller.id,
              executedAt: Between(todayStart, todayEnd),
              deletedAt: IsNull(),
            },
          }),
          this.activityRepo
            .createQueryBuilder('a')
            .select('SUM(a.points)', 'total')
            .where('a.seller_id = :id', { id: seller.id })
            .andWhere(
              'a.executed_at >= :monthStart AND a.executed_at < :monthEnd',
              { monthStart, monthEnd },
            )
            .andWhere('a.deleted_at IS NULL')
            .getRawOne<{ total: string | null }>(),
          this.taskRepo.find({
            where: {
              sellerId: seller.id,
              status: TaskStatus.Pending,
              scheduledAt: LessThan(now),
              deletedAt: IsNull(),
            },
          }),
        ]);

        const pointsToday = todayActivities.reduce(
          (sum, a) => sum + a.points,
          0,
        );
        const avgQualityToday =
          todayActivities.length > 0
            ? todayActivities.reduce((sum, a) => sum + a.quality, 0) /
              todayActivities.length
            : 0;
        const monthlyPoints = Number(monthlyRaw?.total) || 0;
        const overdueCount = overdueTasks.length;

        const raw =
          45 * Math.min(pointsToday / 30, 1) +
          35 * (avgQualityToday / 100) +
          40 * Math.min(monthlyPoints / 50, 1) -
          10 * overdueCount;

        const score = Math.max(0, Math.min(100, raw));

        const semaphore: 'verde' | 'ambar' | 'rojo' =
          score >= 75 ? 'verde' : score >= 45 ? 'ambar' : 'rojo';

        return {
          sellerId: seller.id,
          sellerName: seller.name,
          score: Math.round(score * 10) / 10,
          semaphore,
          pointsToday,
          avgQualityToday: Math.round(avgQualityToday * 10) / 10,
          monthlyPoints,
          overdueCount,
        };
      }),
    );

    return results;
  }
}
