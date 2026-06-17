import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, IsNull, Not } from 'typeorm';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { TaskTypeormEntity } from '../../../tasks/infrastructure/entities/task.typeorm.entity';
import { ClientTypeormEntity } from '../../../clients/infrastructure/entities/client.typeorm.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { ActivityType } from '../../../activities/domain/entities/activity.entity';
import { TaskStatus } from '../../../tasks/domain/entities/task.entity';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { MiDiaDto } from '../dtos/mi-dia.dto';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';

@Injectable()
export class GetMiDiaUseCase implements IUseCase<string, MiDiaDto> {
  constructor(
    @InjectRepository(ActivityTypeormEntity)
    private activityRepo: Repository<ActivityTypeormEntity>,
    @InjectRepository(TaskTypeormEntity)
    private taskRepo: Repository<TaskTypeormEntity>,
    @InjectRepository(ClientTypeormEntity)
    private clientRepo: Repository<ClientTypeormEntity>,
    @InjectRepository(SellerTypeormEntity)
    private sellerRepo: Repository<SellerTypeormEntity>,
    private settingsUseCase: GetSettingsUseCase,
  ) {}

  async execute(sellerId: string): Promise<MiDiaDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowStart = todayEnd;
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    const [seller, settings] = await Promise.all([
      this.sellerRepo.findOne({
        where: { id: sellerId, deletedAt: IsNull() },
      }),
      this.settingsUseCase.execute(),
    ]);

    if (!seller) {
      throw new NotFoundException(`Seller ${sellerId} not found`);
    }

    const coldBefore = new Date(Date.now() - settings.coldAccountDays * 24 * 60 * 60 * 1000);

    const [
      pointsRaw,
      callsToday,
      tomorrowTasksCount,
      newProspectsToday,
      overdueCount,
      coldAccountsCount,
    ] = await Promise.all([
        this.activityRepo
          .createQueryBuilder('a')
          .select('SUM(a.points)', 'total')
          .where('a.seller_id = :sellerId', { sellerId })
          .andWhere('a.executed_at >= :todayStart AND a.executed_at < :todayEnd', {
            todayStart,
            todayEnd,
          })
          .andWhere('a.deleted_at IS NULL')
          .getRawOne<{ total: string | null }>(),

        this.activityRepo.count({
          where: {
            sellerId,
            type: ActivityType.Llamada,
            executedAt: Between(todayStart, todayEnd),
            deletedAt: IsNull(),
          },
        }),

        this.taskRepo.count({
          where: {
            sellerId,
            scheduledAt: Between(tomorrowStart, tomorrowEnd),
            status: Not(TaskStatus.Completed),
            deletedAt: IsNull(),
          },
        }),

        this.clientRepo.count({
          where: {
            sellerId,
            createdAt: Between(todayStart, todayEnd),
            deletedAt: IsNull(),
          },
        }),

        this.taskRepo.count({
          where: {
            sellerId,
            scheduledAt: LessThan(now),
            status: TaskStatus.Pending,
            deletedAt: IsNull(),
          },
        }),

        this.clientRepo
          .createQueryBuilder('c')
          .where('c.seller_id = :sellerId', { sellerId })
          .andWhere('c.deleted_at IS NULL')
          .andWhere('c.created_at < :coldBefore', { coldBefore })
          .andWhere(
            'NOT EXISTS (SELECT 1 FROM activities act WHERE act.client_id = c.id::text AND act.deleted_at IS NULL AND act.executed_at >= :coldBefore)',
          )
          .getCount(),
      ]);

    const pointsToday = Number(pointsRaw?.total) || 0;
    const dailyGoal = settings.dailyMinPoints;

    let semaphore: 'verde' | 'ambar' | 'rojo' | 'morado';
    if (overdueCount > 2) {
      semaphore = 'rojo';
    } else if (pointsToday >= dailyGoal && tomorrowTasksCount >= 5 && overdueCount === 0) {
      semaphore = 'verde';
    } else if (callsToday >= 7 && tomorrowTasksCount === 0) {
      semaphore = 'morado';
    } else if (pointsToday < dailyGoal / 2 && callsToday < 5) {
      semaphore = 'ambar';
    } else {
      semaphore = 'ambar';
    }

    const coachTips: string[] = [];
    if (callsToday > 5 && tomorrowTasksCount === 0) {
      coachTips.push('Tienes buen ritmo de llamadas. Agenda al menos 5 tareas para mañana.');
    }
    if (pointsToday < 10 && callsToday < 3) {
      coachTips.push('Día con pocos puntos. Prioriza llamadas y reuniones de mayor valor.');
    }
    if (overdueCount > 0) {
      coachTips.push(`Tienes ${overdueCount} seguimiento(s) vencido(s). Atiéndelos primero.`);
    }
    if (newProspectsToday === 0) {
      coachTips.push('Sin prospectos nuevos hoy. Considera prospectar antes de que termine el día.');
    }
    if (pointsToday >= dailyGoal && tomorrowTasksCount >= 5) {
      coachTips.push('Excelente día. Mantén el ritmo mañana.');
    }

    return {
      sellerId,
      sellerName: seller.name,
      pointsToday,
      dailyPointsGoal: dailyGoal,
      callsToday,
      dailyCallsGoal: settings.dailyCallsGoal ?? 10,
      tomorrowTasksCount,
      tomorrowTasksGoal: 5,
      newProspectsToday,
      newProspectsGoal: 2,
      overdueCount,
      coldAccountsCount,
      semaphore,
      coachTips,
    };
  }
}
