import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (!existing) throw new NotFoundException(`Task ${id} not found`);
    Object.assign(existing, entity);
    const saved = await this.repo.save(existing);
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findTodayBySeller(sellerId: string, date: Date): Promise<TaskEntity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const { entities, raw } = await this.repo
      .createQueryBuilder('task')
      .addSelect('c.name', 'clientName')
      .addSelect('ct.name', 'contactName')
      .leftJoin('clients', 'c', 'c.id::text = task.client_id::text AND c.deleted_at IS NULL')
      .leftJoin('contacts', 'ct', 'ct.id::text = task.contact_id::text AND ct.deleted_at IS NULL')
      .where('task.sellerId = :sellerId', { sellerId })
      .andWhere('task.scheduledAt >= :start', {
        start: startOfDay,
      })
      .andWhere('task.deletedAt IS NULL')
      .orderBy('task.scheduledAt', 'ASC')
      .getRawAndEntities();

    return entities.map((entity, i) =>
      Object.assign(this.toDomain(entity), {
        clientName: (raw[i].clientName as string | null) ?? null,
        contactName: (raw[i].contactName as string | null) ?? null,
      }),
    );
  }

  async findMonthAllSellers(dateFrom: Date): Promise<TaskEntity[]> {
    const startOfDay = new Date(dateFrom);
    startOfDay.setHours(0, 0, 0, 0);

    const { entities, raw } = await this.repo
      .createQueryBuilder('task')
      .addSelect('c.name', 'clientName')
      .addSelect('ct.name', 'contactName')
      .leftJoin('clients', 'c', 'c.id::text = task.client_id::text AND c.deleted_at IS NULL')
      .leftJoin('contacts', 'ct', 'ct.id::text = task.contact_id::text AND ct.deleted_at IS NULL')
      .where('task.scheduledAt >= :start', { start: startOfDay })
      .andWhere('task.deletedAt IS NULL')
      .orderBy('task.scheduledAt', 'ASC')
      .getRawAndEntities();

    return entities.map((entity, i) =>
      Object.assign(this.toDomain(entity), {
        clientName: (raw[i].clientName as string | null) ?? null,
        contactName: (raw[i].contactName as string | null) ?? null,
      }),
    );
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
    const minuteStart = new Date(scheduledAt);
    minuteStart.setSeconds(0, 0);
    const minuteEnd = new Date(minuteStart.getTime() + 60 * 1000);

    const qb = this.repo
      .createQueryBuilder('task')
      .where('task.sellerId = :sellerId', { sellerId })
      .andWhere('task.status = :status', { status: TaskStatus.Pending })
      .andWhere('task.deletedAt IS NULL')
      .andWhere('task.scheduledAt >= :minuteStart AND task.scheduledAt < :minuteEnd', { minuteStart, minuteEnd });
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
