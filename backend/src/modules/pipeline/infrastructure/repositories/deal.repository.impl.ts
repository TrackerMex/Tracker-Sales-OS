import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { DealEntity } from '../../domain/entities/deal.entity';
import { IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { DealTypeormEntity } from '../entities/deal.typeorm.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { FindAllOptions } from '../../../../core/domain/repository.interface';

@Injectable()
export class DealRepositoryImpl implements IDealsRepository {
  constructor(
    @InjectRepository(DealTypeormEntity)
    private readonly repo: Repository<DealTypeormEntity>,
  ) {}

  async findById(id: string): Promise<DealEntity | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    options?: FindAllOptions,
  ): Promise<{ data: DealEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repo.findAndCount({
      where: options?.where as FindOptionsWhere<DealTypeormEntity>,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data: data.map((e) => this.toDomain(e)), total };
  }

  async create(entity: Partial<DealEntity>): Promise<DealEntity> {
    const saved = await this.repo.save(
      this.repo.create(entity as Partial<DealTypeormEntity>),
    );
    return this.toDomain(saved);
  }

  async update(id: string, entity: Partial<DealEntity>): Promise<DealEntity> {
    const existing = await this.repo.findOne({ where: { id } });
    Object.assign(existing!, entity);
    const saved = await this.repo.save(existing!);
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findBySellerId(sellerId: string): Promise<DealEntity[]> {
    const data = await this.repo.find({
      where: { sellerId } as FindOptionsWhere<DealTypeormEntity>,
      order: { createdAt: 'DESC' },
    });
    return data.map((e) => this.toDomain(e));
  }

  async findByStage(stage: PipelineStage): Promise<DealEntity[]> {
    const data = await this.repo.find({
      where: { stage } as FindOptionsWhere<DealTypeormEntity>,
      order: { createdAt: 'DESC' },
    });
    return data.map((e) => this.toDomain(e));
  }

  private toDomain(entity: DealTypeormEntity): DealEntity {
    return Object.assign(new DealEntity(), {
      ...entity,
      amount: Number(entity.amount),
    });
  }
}
