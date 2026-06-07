import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { UserRole } from '../../../auth/domain/entities/user.entity';
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
  ) {}

  async execute(input: GetClientsInput): Promise<{ data: ClientDto[]; total: number }> {
    const sellerId =
      input.user.role === UserRole.Seller ? input.user.sellerId ?? undefined : input.query.seller;

    const { data, total } = await this.clientRepo.findWithFilters({
      stage: input.query.stage,
      type: input.query.type,
      sellerId,
      q: input.query.q,
      page: input.query.page,
      limit: input.query.limit,
    });

    return { data: data.map((client) => this.toDto(client)), total };
  }

  private toDto(client: ClientEntity): ClientDto {
    return client as ClientDto;
  }
}
