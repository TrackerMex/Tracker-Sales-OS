import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, IsNull, Not } from 'typeorm';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { CoachingDailyDto } from '../dtos/coaching-daily.dto';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { TaskTypeormEntity } from '../../../tasks/infrastructure/entities/task.typeorm.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { TaskStatus } from '../../../tasks/domain/entities/task.entity';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';

@Injectable()
export class GetCoachingDailyUseCase implements IUseCase<
  string,
  CoachingDailyDto
> {
  constructor(
    @InjectRepository(ActivityTypeormEntity)
    private readonly activityRepo: Repository<ActivityTypeormEntity>,
    @InjectRepository(TaskTypeormEntity)
    private readonly taskRepo: Repository<TaskTypeormEntity>,
    @InjectRepository(SellerTypeormEntity)
    private readonly sellerRepo: Repository<SellerTypeormEntity>,
    private readonly getSettings: GetSettingsUseCase,
  ) {}

  async execute(sellerId: string): Promise<CoachingDailyDto> {
    const settings = await this.getSettings.execute();
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
    const tomorrowEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2,
    );

    const [pointsRaw, mixRaw, overdueCount, tomorrowCount, seller] =
      await Promise.all([
        this.activityRepo
          .createQueryBuilder('a')
          .select('SUM(a.points)', 'total')
          .addSelect('AVG(a.quality)', 'avgQ')
          .where('a.sellerId = :sellerId', { sellerId })
          .andWhere(
            'a.executedAt >= :todayStart AND a.executedAt < :todayEnd',
            { todayStart, todayEnd },
          )
          .andWhere('a.deletedAt IS NULL')
          .getRawOne<{ total: string | null; avgQ: string | null }>(),

        this.activityRepo
          .createQueryBuilder('a')
          .select('a.type', 'type')
          .addSelect('COUNT(a.id)', 'count')
          .where('a.sellerId = :sellerId', { sellerId })
          .andWhere(
            'a.executedAt >= :todayStart AND a.executedAt < :todayEnd',
            { todayStart, todayEnd },
          )
          .andWhere('a.deletedAt IS NULL')
          .groupBy('a.type')
          .getRawMany<{ type: string; count: string }>(),

        this.taskRepo.count({
          where: {
            sellerId,
            scheduledAt: LessThan(now),
            status: TaskStatus.Pending,
            deletedAt: IsNull(),
          },
        }),

        this.taskRepo.count({
          where: {
            sellerId,
            scheduledAt: Between(todayEnd, tomorrowEnd),
            status: Not(TaskStatus.Completed),
            deletedAt: IsNull(),
          },
        }),

        this.sellerRepo.findOne({ where: { id: sellerId } }),
      ]);

    const pointsToday = Number(pointsRaw?.total ?? 0);
    const avgQuality = Number(pointsRaw?.avgQ ?? 0);
    const dailyPointsGoal = settings.dailyMinPoints ?? 30;
    const progressPct = Math.min(
      100,
      Math.round((pointsToday / dailyPointsGoal) * 100),
    );

    const total = mixRaw.reduce((sum, r) => sum + Number(r.count), 0);
    const activityMix = mixRaw
      .map((r) => ({
        type: r.type,
        count: Number(r.count),
        percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const mixInsights: string[] = [];
    const chatCount = activityMix.find((m) => m.type === 'Chat')?.count ?? 0;
    const llamadaCount =
      activityMix.find((m) => m.type === 'Llamada')?.count ?? 0;
    const reunionCount = activityMix
      .filter((m) =>
        ['Reunión virtual', 'Reunión presencial', 'Visita física'].includes(
          m.type,
        ),
      )
      .reduce((sum, m) => sum + m.count, 0);
    const propuestaCount =
      activityMix.find((m) => m.type === 'Propuesta')?.count ?? 0;

    if (chatCount > llamadaCount * 2)
      mixInsights.push('Muchos chats vs llamadas. Sube el teléfono.');
    if (llamadaCount > 5 && reunionCount === 0)
      mixInsights.push('Buen ritmo de llamadas. Convierte alguna en reunión.');
    if (propuestaCount > 0 && llamadaCount < 3)
      mixInsights.push('Hay propuestas pero pocas llamadas de seguimiento.');
    if (total === 0) mixInsights.push('Sin actividades registradas hoy.');

    return {
      sellerId,
      sellerName: seller?.name ?? 'Desconocido',
      pointsToday,
      dailyPointsGoal,
      progressPct,
      avgQuality: Math.round(avgQuality),
      activityMix,
      overdueCount,
      tomorrowTasksCount: tomorrowCount,
      totalActivitiesToday: total,
      mixInsights,
    };
  }
}
