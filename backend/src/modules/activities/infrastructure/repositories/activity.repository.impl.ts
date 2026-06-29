import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ActivityEntity, ActivityHistoryEntry } from '../../domain/entities/activity.entity';
import { IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { ActivityTypeormEntity } from '../entities/activity.typeorm.entity';
import { FindAllOptions } from '../../../../core/domain/repository.interface';

@Injectable()
export class ActivityRepositoryImpl implements IActivityRepository {
  constructor(
    @InjectRepository(ActivityTypeormEntity)
    private readonly repo: Repository<ActivityTypeormEntity>,
  ) {}

  async findById(id: string): Promise<ActivityEntity | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(options?: FindAllOptions): Promise<{ data: ActivityEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repo.findAndCount({
      where: options?.where as FindOptionsWhere<ActivityTypeormEntity>,
      skip,
      take: limit,
      order: { executedAt: 'DESC' },
    });

    return { data: data.map((e) => this.toDomain(e)), total };
  }

  async create(entity: Partial<ActivityEntity>): Promise<ActivityEntity> {
    const saved = await this.repo.save(this.repo.create(entity as Partial<ActivityTypeormEntity>));
    return this.toDomain(saved);
  }

  async update(id: string, entity: Partial<ActivityEntity>): Promise<ActivityEntity> {
    const existing = await this.repo.findOne({ where: { id } });
    Object.assign(existing!, entity);
    const saved = await this.repo.save(existing!);
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findDailyBySeller(sellerId: string, date: Date): Promise<ActivityEntity[]> {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    const { entities, raw } = await this.repo
      .createQueryBuilder('activity')
      .addSelect('c.name', 'clientName')
      .addSelect('ct.name', 'contactName')
      .addSelect('t.title', 'taskTitle')
      .leftJoin('clients', 'c', 'c.id = activity.client_id AND c.deleted_at IS NULL')
      .leftJoin('contacts', 'ct', 'ct.id::text = activity.contact_id AND ct.deleted_at IS NULL')
      .leftJoin('tasks', 't', 't.id::text = activity.task_id AND t.deleted_at IS NULL')
      .where('activity.seller_id = :sellerId', { sellerId })
      .andWhere('activity.executed_at >= :start AND activity.executed_at <= :end', { start, end })
      .orderBy('activity.executed_at', 'DESC')
      .getRawAndEntities();

    return entities.map((entity, i) =>
      Object.assign(this.toDomain(entity), {
        clientName: (raw[i].clientName as string | null) ?? null,
        contactName: (raw[i].contactName as string | null) ?? null,
        taskTitle: (raw[i].taskTitle as string | null) ?? null,
      }),
    );
  }

  async sumDailyPoints(sellerId: string, date: Date): Promise<number> {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    const result = await this.repo
      .createQueryBuilder('activity')
      .select('SUM(activity.points)', 'total')
      .where('activity.sellerId = :sellerId', { sellerId })
      .andWhere('activity.executedAt >= :start AND activity.executedAt <= :end', { start, end })
      .getRawOne<{ total: string | null }>();

    return Number(result?.total ?? 0);
  }

  async sumPointsByDayForSellers(
    from: Date,
    to: Date,
  ): Promise<{ sellerId: string; day: string; points: number }[]> {
    const rows = await this.repo
      .createQueryBuilder('activity')
      .select('activity.sellerId', 'sellerId')
      .addSelect("TO_CHAR(activity.executedAt, 'YYYY-MM-DD')", 'day')
      .addSelect('SUM(activity.points)', 'points')
      .where('activity.executedAt >= :from AND activity.executedAt < :to', { from, to })
      .andWhere('activity.deletedAt IS NULL')
      .groupBy('activity.sellerId')
      .addGroupBy("TO_CHAR(activity.executedAt, 'YYYY-MM-DD')")
      .getRawMany<{ sellerId: string; day: string; points: string | null }>();

    return rows.map((r) => ({
      sellerId: r.sellerId,
      day: r.day,
      points: Number(r.points ?? 0),
    }));
  }

  async findRecentBySeller(sellerId: string, limit: number): Promise<ActivityEntity[]> {
    const data = await this.repo.find({
      where: { sellerId } as FindOptionsWhere<ActivityTypeormEntity>,
      order: { executedAt: 'DESC' },
      take: limit,
    });
    return data.map((e) => this.toDomain(e));
  }

  async updateStatus(id: string, status: string, historyEntry: ActivityHistoryEntry): Promise<ActivityEntity> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new Error('Activity not found');
    await this.repo.manager.query(
      `UPDATE activities SET activity_history = activity_history || $1::jsonb, status = $2, updated_at = NOW() WHERE id = $3`,
      [JSON.stringify([historyEntry]), status, id],
    );
    const saved = await this.repo.findOne({ where: { id } });
    return this.toDomain(saved!);
  }

  async findByClientId(clientId: string): Promise<ActivityEntity[]> {
    const data = await this.repo.find({
      where: { clientId } as FindOptionsWhere<ActivityTypeormEntity>,
      order: { executedAt: 'DESC' },
    });
    return data.map((e) => this.toDomain(e));
  }

  private toDomain(entity: ActivityTypeormEntity): ActivityEntity {
    return Object.assign(new ActivityEntity(), entity);
  }
}
