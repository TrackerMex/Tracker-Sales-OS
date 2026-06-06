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

  async findAll() {
    const [data, total] = await this.repo.findAndCount();
    return { data: data.map(this.toDomain), total };
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
