import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import { ClientEntity, ContactEntity } from '../../domain/entities/client.entity';
import {
  CLIENT_REPOSITORY,
  IClientRepository,
} from '../../domain/repositories/client.repository.interface';
import { ClientDto, CreateContactDto, RequestUserDto } from '../dtos/client.dto';

export interface AddContactInput {
  clientId: string;
  dto: CreateContactDto;
  user: RequestUserDto;
}

@Injectable()
export class AddContactUseCase implements IUseCase<AddContactInput, ClientDto> {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: IClientRepository,
  ) {}

  async execute(input: AddContactInput): Promise<ClientDto> {
    const client = await this.clientRepo.findById(input.clientId);
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    this.assertCanAccess(client, input.user);

    const duplicate = await this.clientRepo.checkDuplicates({
      phone: input.dto.phone,
      email: input.dto.email,
    });
    if (duplicate) {
      throw new ConflictException('Ya existe un contacto con ese teléfono o email');
    }

    const updated = await this.clientRepo.addContact(
      input.clientId,
      Object.assign(new ContactEntity(), {
        ...input.dto,
        role: input.dto.role ?? '',
        phone: input.dto.phone ?? '',
        email: input.dto.email ?? '',
        isDecisionMaker: input.dto.isDecisionMaker ?? false,
      }),
    );

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
