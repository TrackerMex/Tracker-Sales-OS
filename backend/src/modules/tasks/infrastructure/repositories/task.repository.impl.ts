import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { TaskEntity, TaskStatus } from '../../domain/entities/task.entity';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { TaskTypeormEntity } from '../entities/task.typeorm.entity';
import { FindAllOptions } from '../../../../core/domain/repository.interface';

@Injectable()
export class TaskRepositoryImpl implements ITaskRepository {
  constructor(
    @InjectRepository(TaskTypeormEntity)
    private readonly repo: Repository<TaskTypeormEntity>,
  ) {}

  async findById(id: string): Promise<TaskEntity | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    options?: FindAllOptions,
  ): Promise<{ data: TaskEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repo.findAndCount({
      where: options?.where as FindOptionsWhere<TaskTypeormEntity>,
      skip,
      take: limit,
      order: { scheduledAt: 'ASC' },
    });

    return { data: data.map((e) => this.toDomain(e)), total };
  }

  async create(entity: Partial<TaskEntity>): Promise<TaskEntity> {
    const saved = await this.repo.save(
      this.repo.create(entity as Partial<TaskTypeormEntity>),
    );
    return this.toDomain(saved);
  }

  async update(id: string, entity: Partial<TaskEntity>): Promise<TaskEntity> {
    const existing = await this.repo.findOne({ where: { id } });
    Object.assign(existing!, entity);
    const saved = await this.repo.save(existing!);
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findTodayBySeller(sellerId: string, date: Date): Promise<TaskEntity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const data = await this.repo
      .createQueryBuilder('task')
      .where('task.sellerId = :sellerId', { sellerId })
      .andWhere('task.scheduledAt >= :start', {
        start: startOfDay,
      })
      .andWhere('task.deletedAt IS NULL')
      .orderBy('task.scheduledAt', 'ASC')
      .getMany();

    return data.map((e) => this.toDomain(e));
  }

  async findOverdueBySeller(sellerId: string): Promise<TaskEntity[]> {
    const now = new Date();

    const data = await this.repo
      .createQueryBuilder('task')
      .where('task.sellerId = :sellerId', { sellerId })
      .andWhere('task.scheduledAt < :now', { now })
      .andWhere('task.status = :status', { status: TaskStatus.Pending })
      .andWhere('task.deletedAt IS NULL')
      .orderBy('task.scheduledAt', 'ASC')
      .getMany();

    return data.map((e) => this.toDomain(e));
  }

  async findConflictingTask(sellerId: string, scheduledAt: Date, excludeTaskId?: string): Promise<TaskEntity | null> {
    const qb = this.repo
      .createQueryBuilder('task')
      .where('task.sellerId = :sellerId', { sellerId })
      .andWhere('task.status = :status', { status: TaskStatus.Pending })
      .andWhere('task.deletedAt IS NULL')
      .andWhere(
        "date_trunc('minute', task.scheduled_at) = date_trunc('minute', :scheduledAt::timestamptz)",
        { scheduledAt },
      );
    if (excludeTaskId) {
      qb.andWhere('task.id != :excludeTaskId', { excludeTaskId });
    }
    const entity = await qb.getOne();
    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(entity: TaskTypeormEntity): TaskEntity {
    return Object.assign(new TaskEntity(), entity);
  }
}
