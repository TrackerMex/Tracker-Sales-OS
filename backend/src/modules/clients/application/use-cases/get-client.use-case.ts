import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import {
  CLIENT_REPOSITORY,
  IClientRepository,
} from '../../domain/repositories/client.repository.interface';
import { ClientDto, RequestUserDto } from '../dtos/client.dto';

export interface GetClientInput {
  id: string;
  user: RequestUserDto;
}

type ClientDetailDto = Omit<
  ClientDto,
  'lastActivityAt' | 'isCold' | 'dataQuality'
>;

@Injectable()
export class GetClientUseCase implements IUseCase<
  GetClientInput,
  ClientDetailDto
> {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: IClientRepository,
  ) {}

  async execute(input: GetClientInput): Promise<ClientDetailDto> {
    if (input.user.role === UserRole.Seller && !input.user.sellerId) {
      throw new ForbiddenException('No tienes identidad de vendedor');
    }

    const client = await this.clientRepo.findById(input.id);
    if (!client || client.deletedAt) {
      throw new NotFoundException('Cliente no encontrado');
    }
    if (
      input.user.role === UserRole.Seller &&
      client.sellerId !== input.user.sellerId
    ) {
      throw new ForbiddenException('No tienes acceso a este cliente');
    }
    return client;
  }
}
