import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { IUseCase } from '../../../../core/domain/use-case.interface';

export interface ActivityTrendItem {
  date: string;
  count: number;
}

@Injectable()
export class GetActivityTrendUseCase implements IUseCase<void, ActivityTrendItem[]> {
  constructor(
    @InjectRepository(ActivityTypeormEntity)
    private readonly activityRepo: Repository<ActivityTypeormEntity>,
  ) {}

  async execute(): Promise<ActivityTrendItem[]> {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);

    const rows = await this.activityRepo
      .createQueryBuilder('a')
      .select("TO_CHAR(a.executed_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('a.executed_at >= :start', { start })
      .andWhere('a.deleted_at IS NULL')
      .groupBy("TO_CHAR(a.executed_at, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(a.executed_at, 'YYYY-MM-DD')", 'ASC')
      .getRawMany<{ date: string; count: string }>();

    // Build full 14-day array filling in zeros for missing days
    const result: ActivityTrendItem[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = rows.find((r) => r.date === dateStr);
      result.push({ date: dateStr, count: found ? Number(found.count) : 0 });
    }
    return result;
  }
}
