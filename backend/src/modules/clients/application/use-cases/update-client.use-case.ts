import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import { ClientEntity } from '../../domain/entities/client.entity';
import {
  CLIENT_REPOSITORY,
  IClientRepository,
} from '../../domain/repositories/client.repository.interface';
import { ClientDto, RequestUserDto, UpdateClientDto } from '../dtos/client.dto';

export interface UpdateClientInput {
  id: string;
  dto: UpdateClientDto;
  user: RequestUserDto;
}

@Injectable()
export class UpdateClientUseCase implements IUseCase<UpdateClientInput, ClientDto> {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: IClientRepository,
  ) {}

  async execute(input: UpdateClientInput): Promise<ClientDto> {
    const current = await this.clientRepo.findById(input.id);
    if (!current) {
      throw new NotFoundException('Cliente no encontrado');
    }

    this.assertCanAccess(current, input.user);

    if (input.dto.name || input.dto.domain) {
      const duplicate = await this.clientRepo.checkDuplicates({
        name: input.dto.name ?? current.name,
        domain: input.dto.domain ?? current.domain ?? undefined,
        excludeId: input.id,
      });
      if (duplicate) {
        throw new ConflictException('Ya existe un cliente con ese nombre o dominio');
      }
    }

    const patch =
      input.user.role === UserRole.Seller
        ? { ...input.dto, sellerId: current.sellerId }
        : input.dto;

    const updated = await this.clientRepo.update(input.id, patch);
    return this.toDto(updated);
  }

  private assertCanAccess(client: ClientEntity, user: RequestUserDto): void {
    if (user.role === UserRole.Seller && client.sellerId !== user.sellerId) {
      throw new ForbiddenException('No tienes acceso a este cliente');
    }
  }

  private toDto(client: ClientEntity): ClientDto {
    return client as ClientDto;
  }
}
