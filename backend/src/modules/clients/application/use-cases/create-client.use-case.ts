import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import { ClientEntity, ContactEntity, PipelineStage } from '../../domain/entities/client.entity';
import {
  CLIENT_REPOSITORY,
  IClientRepository,
} from '../../domain/repositories/client.repository.interface';
import { ClientDto, CreateClientDto, RequestUserDto } from '../dtos/client.dto';

export interface CreateClientInput {
  dto: CreateClientDto;
  user: RequestUserDto;
}

@Injectable()
export class CreateClientUseCase implements IUseCase<CreateClientInput, ClientDto> {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: IClientRepository,
  ) {}

  async execute(input: CreateClientInput): Promise<ClientDto> {
    const sellerId = this.resolveSellerId(input.dto.sellerId, input.user);
    const contacts = input.dto.contacts ?? [];

    this.assertUniqueContactsInPayload(contacts);

    const duplicate = await this.clientRepo.checkDuplicates({
      name: input.dto.name,
      domain: input.dto.domain,
    });
    if (duplicate) {
      throw new ConflictException('Ya existe un cliente con ese nombre o dominio');
    }

    for (const contact of contacts) {
      const contactDuplicate = await this.clientRepo.checkDuplicates({
        phone: contact.phone,
        email: contact.email,
      });
      if (contactDuplicate) {
        throw new ConflictException('Ya existe un contacto con ese teléfono o email');
      }
    }

    const created = await this.clientRepo.create({
      ...input.dto,
      sellerId,
      domain: input.dto.domain ?? null,
      stage: input.dto.stage ?? PipelineStage.Prospecto,
      expectedAmount: input.dto.expectedAmount ?? 0,
      units: input.dto.units ?? 0,
      pain: input.dto.pain ?? null,
      provider: input.dto.provider ?? null,
      nextStep: input.dto.nextStep ?? null,
      nextDate: input.dto.nextDate ?? null,
      nextTime: input.dto.nextTime ?? null,
      contacts: contacts.map((contact) =>
        Object.assign(new ContactEntity(), {
          ...contact,
          role: contact.role ?? '',
          phone: contact.phone ?? '',
          email: contact.email ?? '',
          isDecisionMaker: contact.isDecisionMaker ?? false,
        }),
      ),
    });

    return this.toDto(created);
  }

  private resolveSellerId(dtoSellerId: string | undefined, user: RequestUserDto): string {
    if (user.role === UserRole.Seller) {
      if (!user.sellerId) {
        throw new BadRequestException('El usuario vendedor no tiene sellerId');
      }
      return user.sellerId;
    }

    if (!dtoSellerId) {
      throw new BadRequestException('sellerId es requerido para Admin o Director');
    }
    return dtoSellerId;
  }

  private assertUniqueContactsInPayload(contacts: CreateClientDto['contacts'] = []): void {
    const phones = new Set<string>();
    const emails = new Set<string>();

    for (const contact of contacts) {
      const phone = contact.phone?.replace(/\D/g, '');
      const email = contact.email?.trim().toLowerCase();

      if (phone) {
        if (phones.has(phone)) {
          throw new ConflictException('Hay teléfonos duplicados en los contactos');
        }
        phones.add(phone);
      }

      if (email) {
        if (emails.has(email)) {
          throw new ConflictException('Hay emails duplicados en los contactos');
        }
        emails.add(email);
      }
    }
  }

  private toDto(client: ClientEntity): ClientDto {
    return client as ClientDto;
  }
}
