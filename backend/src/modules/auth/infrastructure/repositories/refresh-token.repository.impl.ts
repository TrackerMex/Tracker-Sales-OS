import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenTypeormEntity } from '../entities/refresh-token.typeorm.entity';

@Injectable()
export class RefreshTokenRepositoryImpl implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenTypeormEntity)
    private readonly repo: Repository<RefreshTokenTypeormEntity>,
  ) {}

  async findById(id: string): Promise<RefreshTokenEntity | null> {
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

  async create(
    partial: Partial<RefreshTokenEntity>,
  ): Promise<RefreshTokenEntity> {
    const entity = this.repo.create(
      partial as Partial<RefreshTokenTypeormEntity>,
    );
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    partial: Partial<RefreshTokenEntity>,
  ): Promise<RefreshTokenEntity> {
    await this.repo.update(id, partial);
    const updated = await this.repo.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    // refresh_tokens no tiene columna deleted_at (el ciclo de vida es
    // revoked_at, no soft-delete). Se mapea softDelete() a una revocación
    // como fallback seguro del contrato IRepository; ningún use-case de
    // esta feature lo invoca.
    await this.repo.update(id, { revokedAt: new Date() });
  }

  async revokeAllActiveForUser(userId: string): Promise<void> {
    await this.repo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private toDomain(entity: RefreshTokenTypeormEntity): RefreshTokenEntity {
    return Object.assign(new RefreshTokenEntity(), entity);
  }
}
