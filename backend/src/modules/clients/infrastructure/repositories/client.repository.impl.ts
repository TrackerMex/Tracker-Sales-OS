import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ClientEntity, ContactEntity } from '../../domain/entities/client.entity';
import {
  ClientFilters,
  DuplicateCheckParams,
  IClientRepository,
} from '../../domain/repositories/client.repository.interface';
import { ClientTypeormEntity } from '../entities/client.typeorm.entity';
import { ContactTypeormEntity } from '../entities/contact.typeorm.entity';

@Injectable()
export class ClientRepositoryImpl implements IClientRepository {
  constructor(
    @InjectRepository(ClientTypeormEntity)
    private readonly repo: Repository<ClientTypeormEntity>,
    @InjectRepository(ContactTypeormEntity)
    private readonly contactRepo: Repository<ContactTypeormEntity>,
  ) {}

  async findById(id: string): Promise<ClientEntity | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { contacts: true },
      order: { contacts: { createdAt: 'ASC' } },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(options?: { page?: number; limit?: number }) {
    return this.findWithFilters({
      page: options?.page,
      limit: options?.limit,
    });
  }

  async findBySellerId(sellerId: string): Promise<ClientEntity[]> {
    const { data } = await this.findWithFilters({ sellerId, limit: 100 });
    return data;
  }

  async findWithFilters(filters: ClientFilters): Promise<{ data: ClientEntity[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const query = this.repo
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.contacts', 'contact')
      .orderBy('client.createdAt', 'DESC')
      .addOrderBy('contact.createdAt', 'ASC')
      .skip(skip)
      .take(limit);

    if (filters.stage) {
      query.andWhere('client.stage = :stage', { stage: filters.stage });
    }

    if (filters.type) {
      query.andWhere('client.type = :type', { type: filters.type });
    }

    if (filters.sellerId) {
      query.andWhere('client.sellerId = :sellerId', { sellerId: filters.sellerId });
    }

    if (filters.q?.trim()) {
      const q = `%${filters.q.trim()}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('client.name ILIKE :q', { q })
            .orWhere('client.domain ILIKE :q', { q })
            .orWhere('client.pain ILIKE :q', { q })
            .orWhere('client.provider ILIKE :q', { q })
            .orWhere('client.nextStep ILIKE :q', { q })
            .orWhere('contact.name ILIKE :q', { q })
            .orWhere('contact.email ILIKE :q', { q })
            .orWhere('contact.phone ILIKE :q', { q });
        }),
      );
    }

    const [data, total] = await query.getManyAndCount();
    return { data: data.map((entity) => this.toDomain(entity)), total };
  }

  async create(partial: Partial<ClientEntity>): Promise<ClientEntity> {
    const { contacts, ...client } = partial;
    const entity = this.repo.create(this.cleanNullable(client) as Partial<ClientTypeormEntity>);
    const saved = await this.repo.save(entity);

    if (contacts?.length) {
      await this.contactRepo.save(
        contacts.map((contact) =>
          this.contactRepo.create({
            ...this.cleanContact(contact),
            clientId: saved.id,
          }),
        ),
      );
    }

    return (await this.findById(saved.id)) as ClientEntity;
  }

  async update(id: string, partial: Partial<ClientEntity>): Promise<ClientEntity> {
    const { contacts: _contacts, ...client } = partial;
    await this.repo.update(id, this.cleanNullable(client) as Partial<ClientTypeormEntity>);
    return (await this.findById(id)) as ClientEntity;
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async checkDuplicates(params: DuplicateCheckParams): Promise<ClientEntity | null> {
    const normalizedPhone = this.normalizePhone(params.phone);
    const normalizedEmail = params.email?.trim().toLowerCase();
    const normalizedDomain = params.domain?.trim().toLowerCase();
    const normalizedName = params.name?.trim().toLowerCase();

    if (!normalizedName && !normalizedDomain && !normalizedPhone && !normalizedEmail) {
      return null;
    }

    const query = this.repo
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.contacts', 'contact');

    if (params.excludeId) {
      query.andWhere('client.id != :excludeId', { excludeId: params.excludeId });
    }

    query.andWhere(
      new Brackets((qb) => {
        let hasCondition = false;

        if (normalizedName) {
          qb.where('LOWER(client.name) = :name', { name: normalizedName });
          hasCondition = true;
        }

        if (normalizedDomain) {
          const method = hasCondition ? 'orWhere' : 'where';
          qb[method]('LOWER(client.domain) = :domain', { domain: normalizedDomain });
          hasCondition = true;
        }

        if (normalizedPhone) {
          const method = hasCondition ? 'orWhere' : 'where';
          qb[method]("REGEXP_REPLACE(contact.phone, '[^0-9]', '', 'g') = :phone", {
            phone: normalizedPhone,
          });
          hasCondition = true;
        }

        if (normalizedEmail) {
          const method = hasCondition ? 'orWhere' : 'where';
          qb[method]('LOWER(contact.email) = :email', { email: normalizedEmail });
        }
      }),
    );

    const duplicate = await query.getOne();
    return duplicate ? this.toDomain(duplicate) : null;
  }

  async addContact(clientId: string, contact: Partial<ContactEntity>): Promise<ClientEntity> {
    await this.contactRepo.save(
      this.contactRepo.create({
        ...this.cleanContact(contact),
        clientId,
      }),
    );
    return (await this.findById(clientId)) as ClientEntity;
  }

  private toDomain(entity: ClientTypeormEntity): ClientEntity {
    const client = Object.assign(new ClientEntity(), {
      ...entity,
      expectedAmount: Number(entity.expectedAmount ?? 0),
      contacts: (entity.contacts ?? []).map((contact) =>
        Object.assign(new ContactEntity(), contact),
      ),
    });
    return client;
  }

  private cleanNullable(entity: Partial<ClientEntity>): Partial<ClientEntity> {
    return {
      ...entity,
      domain: this.emptyToNull(entity.domain),
      pain: this.emptyToNull(entity.pain),
      provider: this.emptyToNull(entity.provider),
      nextStep: this.emptyToNull(entity.nextStep),
      nextDate: this.emptyToNull(entity.nextDate),
      nextTime: this.emptyToNull(entity.nextTime),
    };
  }

  private cleanContact(contact: Partial<ContactEntity>): Partial<ContactEntity> {
    return {
      ...contact,
      role: contact.role ?? '',
      phone: contact.phone?.trim() ?? '',
      email: contact.email?.trim().toLowerCase() ?? '',
      isDecisionMaker: contact.isDecisionMaker ?? false,
    };
  }

  private emptyToNull(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private normalizePhone(phone?: string): string | undefined {
    const normalized = phone?.replace(/\D/g, '');
    return normalized || undefined;
  }
}
