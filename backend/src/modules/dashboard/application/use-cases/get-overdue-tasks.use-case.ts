import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan } from 'typeorm';
import { TaskTypeormEntity } from '../../../tasks/infrastructure/entities/task.typeorm.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { TaskStatus } from '../../../tasks/domain/entities/task.entity';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { OverdueTaskDto } from '../dtos/overdue-task.dto';

@Injectable()
export class GetOverdueTasksUseCase implements IUseCase<
  void,
  OverdueTaskDto[]
> {
  constructor(
    @InjectRepository(TaskTypeormEntity)
    private taskRepo: Repository<TaskTypeormEntity>,
    @InjectRepository(SellerTypeormEntity)
    private sellerRepo: Repository<SellerTypeormEntity>,
  ) {}

  async execute(): Promise<OverdueTaskDto[]> {
    const now = new Date();

    const [sellers, tasks] = await Promise.all([
      this.sellerRepo.find({ where: { active: true, deletedAt: IsNull() } }),
      this.taskRepo.find({
        where: {
          status: TaskStatus.Pending,
          scheduledAt: LessThan(now),
          deletedAt: IsNull(),
        },
      }),
    ]);

    const sellerMap = new Map(sellers.map((s) => [s.id, s.name]));

    const mapped: OverdueTaskDto[] = tasks
      .filter((task) => sellerMap.has(task.sellerId))
      .map((task) => {
        const daysOverdue = Math.floor(
          (now.getTime() - task.scheduledAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          taskId: task.id,
          sellerId: task.sellerId,
          sellerName: sellerMap.get(task.sellerId)!,
          title: task.title,
          scheduledAt: task.scheduledAt,
          daysOverdue,
        };
      });

    return mapped.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }
}
