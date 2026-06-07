import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISellerRepository } from '../../domain/repositories/seller.repository.interface';
import { SellerEntity } from '../../domain/entities/seller.entity';
import { SellerTypeormEntity } from '../entities/seller.typeorm.entity';

@Injectable()
export class SellerRepositoryImpl implements ISellerRepository {
  constructor(
    @InjectRepository(SellerTypeormEntity)
    private readonly repo: Repository<SellerTypeormEntity>,
  ) {}

  async findById(id: string): Promise<SellerEntity | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: data.map((e) => this.toDomain(e)), total };
  }

  async findAllActive(): Promise<SellerEntity[]> {
    const [data] = await this.repo.findAndCount({
      where: { active: true },
      order: { createdAt: 'DESC' },
    });
    return data.map((e) => this.toDomain(e));
  }

  async create(partial: Partial<SellerEntity>): Promise<SellerEntity> {
    const entity = this.repo.create(partial as Partial<SellerTypeormEntity>);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    partial: Partial<SellerEntity>,
  ): Promise<SellerEntity> {
    await this.repo.update(id, partial as Partial<SellerTypeormEntity>);
    const updated = await this.repo.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  private toDomain(entity: SellerTypeormEntity): SellerEntity {
    return Object.assign(new SellerEntity(), entity);
  }
}
