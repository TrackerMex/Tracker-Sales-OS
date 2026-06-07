import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { SaleTypeormEntity } from '../../../sales/infrastructure/entities/sale.typeorm.entity';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { DashboardSummaryDto } from '../dtos/dashboard-summary.dto';

@Injectable()
export class GetDashboardSummaryUseCase implements IUseCase<
  void,
  DashboardSummaryDto
> {
  constructor(
    @InjectRepository(ActivityTypeormEntity)
    private activityRepo: Repository<ActivityTypeormEntity>,
    @InjectRepository(SaleTypeormEntity)
    private saleRepo: Repository<SaleTypeormEntity>,
  ) {}

  async execute(): Promise<DashboardSummaryDto> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const activityRaw = await this.activityRepo
      .createQueryBuilder('a')
      .select('SUM(a.points)', 'totalPoints')
      .addSelect('AVG(a.quality)', 'avgQuality')
      .where('a.executed_at >= :start AND a.executed_at < :end', { start, end })
      .andWhere('a.deleted_at IS NULL')
      .getRawOne<{ totalPoints: string | null; avgQuality: string | null }>();

    const saleRaw = await this.saleRepo
      .createQueryBuilder('s')
      .select('SUM(s.amount)', 'totalAmount')
      .addSelect('SUM(s.units)', 'totalUnits')
      .addSelect('COUNT(s.id)', 'totalCount')
      .where('s.date >= :start AND s.date < :end', { start, end })
      .andWhere('s.deleted_at IS NULL')
      .getRawOne<{
        totalAmount: string | null;
        totalUnits: string | null;
        totalCount: string | null;
      }>();

    const month = now.toISOString().slice(0, 7);

    return {
      month,
      totalSalesAmount: Number(saleRaw?.totalAmount) || 0,
      totalUnits: Number(saleRaw?.totalUnits) || 0,
      totalPoints: Number(activityRaw?.totalPoints) || 0,
      avgQuality: Number(activityRaw?.avgQuality) || 0,
      totalSalesCount: Number(saleRaw?.totalCount) || 0,
    };
  }
}
