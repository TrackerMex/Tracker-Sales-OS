import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In } from 'typeorm';
import { DealEntity } from '../../domain/entities/deal.entity';
import { IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { DealTypeormEntity } from '../entities/deal.typeorm.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { FindAllOptions } from '../../../../core/domain/repository.interface';
import { ClientTypeormEntity } from '../../../clients/infrastructure/entities/client.typeorm.entity';
import { ContactTypeormEntity } from '../../../clients/infrastructure/entities/contact.typeorm.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';

@Injectable()
export class DealRepositoryImpl implements IDealsRepository {
  constructor(
    @InjectRepository(DealTypeormEntity)
    private readonly repo: Repository<DealTypeormEntity>,
    @InjectRepository(ClientTypeormEntity)
    private readonly clientRepo: Repository<ClientTypeormEntity>,
    @InjectRepository(ContactTypeormEntity)
    private readonly contactRepo: Repository<ContactTypeormEntity>,
    @InjectRepository(SellerTypeormEntity)
    private readonly sellerRepo: Repository<SellerTypeormEntity>,
  ) {}

  async findById(id: string): Promise<DealEntity | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    options?: FindAllOptions,
  ): Promise<{ data: DealEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repo.findAndCount({
      where: options?.where as FindOptionsWhere<DealTypeormEntity>,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data: data.map((e) => this.toDomain(e)), total };
  }

  async create(entity: Partial<DealEntity>): Promise<DealEntity> {
    const saved = await this.repo.save(
      this.repo.create(entity as Partial<DealTypeormEntity>),
    );
    return this.toDomain(saved);
  }

  async update(id: string, entity: Partial<DealEntity>): Promise<DealEntity> {
    const existing = await this.repo.findOne({ where: { id } });
    Object.assign(existing!, entity);
    const saved = await this.repo.save(existing!);
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findBySellerId(sellerId: string): Promise<DealEntity[]> {
    const data = await this.repo.find({
      where: { sellerId } as FindOptionsWhere<DealTypeormEntity>,
      order: { createdAt: 'DESC' },
    });
    return data.map((e) => this.toDomain(e));
  }

  async findByStage(stage: PipelineStage): Promise<DealEntity[]> {
    const data = await this.repo.find({
      where: { stage } as FindOptionsWhere<DealTypeormEntity>,
      order: { createdAt: 'DESC' },
    });
    return data.map((e) => this.toDomain(e));
  }

  async findByClientIdAndSellerId(clientId: string, sellerId: string): Promise<DealEntity | null> {
    const entity = await this.repo.findOne({
      where: { clientId, sellerId } as FindOptionsWhere<DealTypeormEntity>,
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findDetailedBySellerId(sellerId: string): Promise<{
    deal: DealEntity;
    clientName: string;
    contactName: string | null;
    contactRole: string | null;
    painPoint: string | null;
    sellerName: string | null;
    clientNextStep: string | null;
    clientNextDate: string | null;
    clientNextTime: string | null;
  }[]> {
    const deals = await this.repo.find({
      where: { sellerId } as FindOptionsWhere<DealTypeormEntity>,
      order: { createdAt: 'DESC' },
    });

    const clientIds = [...new Set(deals.map((d) => d.clientId))];
    const sellerIds = [...new Set(deals.map((d) => d.sellerId))];

    const clients = clientIds.length > 0
      ? await this.clientRepo.findBy({ id: In(clientIds) })
      : [];
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const contacts = clientIds.length > 0
      ? await this.contactRepo.createQueryBuilder('contact')
          .where('contact.client_id IN (:...clientIds)', { clientIds })
          .andWhere('contact.is_decision_maker = :isDM', { isDM: true })
          .getMany()
      : [];
    const contactMap = new Map(contacts.map((c) => [c.clientId, c]));

    const sellers = sellerIds.length > 0
      ? await this.sellerRepo.findBy({ id: In(sellerIds) })
      : [];
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    return deals.map((deal) => {
      const client = clientMap.get(deal.clientId);
      const contact = contactMap.get(deal.clientId);
      const seller = sellerMap.get(deal.sellerId);
      return {
        deal: this.toDomain(deal),
        clientName: client?.name ?? deal.clientName,
        contactName: contact?.name ?? null,
        contactRole: contact?.role ?? null,
        painPoint: client?.pain ?? null,
        sellerName: seller?.name ?? null,
        clientNextStep: client?.nextStep ?? null,
        clientNextDate: client?.nextDate ?? null,
        clientNextTime: client?.nextTime ?? null,
      };
    });
  }

  async getWeightedForecast(): Promise<number> {
    const raw = await this.repo
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.amount * d.probability / 100), 0)', 'forecast')
      .where('d.stage != :lost', { lost: PipelineStage.Perdido })
      .andWhere('d.deleted_at IS NULL')
      .getRawOne<{ forecast: string }>();
    return Number(raw?.forecast) || 0;
  }

  private toDomain(entity: DealTypeormEntity): DealEntity {
    return Object.assign(new DealEntity(), {
      ...entity,
      amount: Number(entity.amount),
    });
  }
}
