import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';
import { ClientEntity } from '../../domain/entities/client.entity';
import {
  CLIENT_REPOSITORY,
  IClientRepository,
} from '../../domain/repositories/client.repository.interface';
import { ClientDto, GetClientsQueryDto, RequestUserDto } from '../dtos/client.dto';

export interface GetClientsInput {
  query: GetClientsQueryDto;
  user: RequestUserDto;
}

@Injectable()
export class GetClientsUseCase
  implements IUseCase<GetClientsInput, { data: ClientDto[]; total: number }>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: IClientRepository,
    @InjectRepository(ActivityTypeormEntity)
    private readonly activityRepo: Repository<ActivityTypeormEntity>,
    private readonly getSettings: GetSettingsUseCase,
  ) {}

  async execute(input: GetClientsInput): Promise<{ data: ClientDto[]; total: number }> {
    if (input.user.role === UserRole.Seller && !input.user.sellerId) {
      return { data: [], total: 0 };
    }
    const sellerId =
      input.user.role === UserRole.Seller ? input.user.sellerId! : input.query.seller;

    const settings = await this.getSettings.execute();
    const coldBefore = new Date(Date.now() - settings.coldAccountDays * 24 * 60 * 60 * 1000);

    const { data, total } = await this.clientRepo.findWithFilters({
      stage: input.query.stage,
      type: input.query.type,
      sellerId,
      q: input.query.q,
      page: input.query.page,
      limit: input.query.limit,
      coldBefore: input.query.cold ? coldBefore : undefined,
    });

    const lastMap = await this.getLastActivityMap(data.map((c) => c.id));
    return { data: data.map((client) => this.toDto(client, lastMap, coldBefore)), total };
  }

  private async getLastActivityMap(ids: string[]): Promise<Map<string, Date>> {
    if (ids.length === 0) return new Map();

    const rows = await this.activityRepo
      .createQueryBuilder('a')
      .select('a.client_id', 'clientId')
      .addSelect('MAX(a.executed_at)', 'last')
      .where('a.client_id IN (:...ids)', { ids })
      .andWhere('a.deleted_at IS NULL')
      .groupBy('a.client_id')
      .getRawMany<{ clientId: string; last: string }>();

    return new Map(rows.map((r) => [r.clientId, new Date(r.last)]));
  }

  private toDto(client: ClientEntity, lastMap: Map<string, Date>, coldBefore: Date): ClientDto {
    const last = lastMap.get(client.id) ?? null;
    const ref = last ?? client.createdAt;
    return {
      ...(client as any),
      lastActivityAt: last ? last.toISOString() : null,
      isCold: ref < coldBefore,
    } as ClientDto;
  }
}
