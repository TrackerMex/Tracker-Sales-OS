import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SaleEntity } from '../../domain/entities/sale.entity';
import { ISaleRepository, SaleFilters } from '../../domain/repositories/sale.repository.interface';
import { SaleTypeormEntity } from '../entities/sale.typeorm.entity';
import { FindAllOptions } from '../../../../core/domain/repository.interface';

@Injectable()
export class SaleRepositoryImpl implements ISaleRepository {
  constructor(
    @InjectRepository(SaleTypeormEntity)
    private readonly repo: Repository<SaleTypeormEntity>,
  ) {}

  async findById(id: string): Promise<SaleEntity | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    options?: FindAllOptions,
  ): Promise<{ data: SaleEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repo.findAndCount({
      where: options?.where as FindOptionsWhere<SaleTypeormEntity>,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data: data.map((e) => this.toDomain(e)), total };
  }

  async create(entity: Partial<SaleEntity>): Promise<SaleEntity> {
    const saved = await this.repo.save(
      this.repo.create(entity as Partial<SaleTypeormEntity>),
    );
    return this.toDomain(saved);
  }

  async update(id: string, entity: Partial<SaleEntity>): Promise<SaleEntity> {
    const existing = await this.repo.findOne({ where: { id } });
    Object.assign(existing!, entity);
    const saved = await this.repo.save(existing!);
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findWithFilters(
    filters: SaleFilters,
    page: number,
    limit: number,
  ): Promise<{ data: SaleEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const qb = this.repo
      .createQueryBuilder('sale')
      .where('sale.deletedAt IS NULL');

    if (filters.sellerId) {
      qb.andWhere('sale.sellerId = :sellerId', { sellerId: filters.sellerId });
    }

    if (filters.type) {
      qb.andWhere('sale.type = :type', { type: filters.type });
    }

    if (filters.month) {
      qb.andWhere(
        `DATE_TRUNC('month', sale.date) = DATE_TRUNC('month', :month::date)`,
        { month: `${filters.month}-01` },
      );
    }

    qb.orderBy('sale.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data: data.map((e) => this.toDomain(e)), total };
  }

  private toDomain(entity: SaleTypeormEntity): SaleEntity {
    return Object.assign(new SaleEntity(), {
      ...entity,
      amount: Number(entity.amount),
    });
  }
}
