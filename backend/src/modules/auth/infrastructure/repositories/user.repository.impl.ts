import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserTypeormEntity } from '../entities/user.typeorm.entity';

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(
    @InjectRepository(UserTypeormEntity)
    private readonly repo: Repository<UserTypeormEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const entity = await this.repo.findOne({ where: { username } });
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

  async create(partial: Partial<UserEntity>): Promise<UserEntity> {
    const entity = this.repo.create(partial as Partial<UserTypeormEntity>);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, partial: Partial<UserEntity>): Promise<UserEntity> {
    await this.repo.update(id, partial as Partial<UserTypeormEntity>);
    const updated = await this.repo.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  private toDomain(entity: UserTypeormEntity): UserEntity {
    return Object.assign(new UserEntity(), entity);
  }
}
