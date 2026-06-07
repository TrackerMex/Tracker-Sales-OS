import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { UserTypeormEntity } from '../../../auth/infrastructure/entities/user.typeorm.entity';
import { ClientTypeormEntity } from '../../../clients/infrastructure/entities/client.typeorm.entity';
import { ContactTypeormEntity } from '../../../clients/infrastructure/entities/contact.typeorm.entity';
import { DealTypeormEntity } from '../../../pipeline/infrastructure/entities/deal.typeorm.entity';
import { TaskTypeormEntity } from '../../../tasks/infrastructure/entities/task.typeorm.entity';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { SaleTypeormEntity } from '../../../sales/infrastructure/entities/sale.typeorm.entity';
import { SettingTypeormEntity } from '../../../settings/infrastructure/entities/setting.typeorm.entity';
import { ImportDataDto } from '../dtos/import-data.dto';

@Injectable()
export class ImportDataUseCase {
  constructor(
    @InjectRepository(SellerTypeormEntity) private readonly sellers: Repository<SellerTypeormEntity>,
    @InjectRepository(UserTypeormEntity) private readonly users: Repository<UserTypeormEntity>,
    @InjectRepository(ClientTypeormEntity) private readonly clients: Repository<ClientTypeormEntity>,
    @InjectRepository(ContactTypeormEntity) private readonly contacts: Repository<ContactTypeormEntity>,
    @InjectRepository(DealTypeormEntity) private readonly deals: Repository<DealTypeormEntity>,
    @InjectRepository(TaskTypeormEntity) private readonly tasks: Repository<TaskTypeormEntity>,
    @InjectRepository(ActivityTypeormEntity) private readonly activities: Repository<ActivityTypeormEntity>,
    @InjectRepository(SaleTypeormEntity) private readonly sales: Repository<SaleTypeormEntity>,
    @InjectRepository(SettingTypeormEntity) private readonly settings: Repository<SettingTypeormEntity>,
  ) {}

  async execute(dto: ImportDataDto): Promise<{ success: boolean; counts: Record<string, number> }> {
    const counts: Record<string, number> = {};

    if (dto.settings?.length) {
      for (const item of dto.settings) {
        await this.settings.upsert(
          { id: item.id, key: item.key, value: item.value, updatedAt: item.updatedAt },
          ['id'],
        );
      }
      counts.settings = dto.settings.length;
    }

    if (dto.sellers?.length) {
      for (const item of dto.sellers) {
        await this.sellers.upsert(
          {
            id: item.id,
            name: item.name,
            profile: item.profile,
            userId: item.userId,
            active: item.active,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          ['id'],
        );
      }
      counts.sellers = dto.sellers.length;
    }

    if (dto.users?.length) {
      for (const item of dto.users) {
        await this.users.upsert(
          {
            id: item.id,
            username: item.username,
            passwordHash: item.passwordHash,
            name: item.name,
            role: item.role as any,
            sellerId: item.sellerId,
            active: item.active,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          ['id'],
        );
      }
      counts.users = dto.users.length;
    }

    if (dto.clients?.length) {
      for (const item of dto.clients) {
        await this.clients.upsert(
          {
            id: item.id,
            name: item.name,
            domain: item.domain,
            type: item.type as any,
            person: item.person as any,
            sellerId: item.sellerId,
            source: item.source as any,
            stage: item.stage as any,
            expectedAmount: item.expectedAmount,
            units: item.units,
            pain: item.pain,
            provider: item.provider,
            nextStep: item.nextStep,
            nextDate: item.nextDate,
            nextTime: item.nextTime,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          ['id'],
        );
      }
      counts.clients = dto.clients.length;
    }

    if (dto.contacts?.length) {
      for (const item of dto.contacts) {
        await this.contacts.upsert(
          {
            id: item.id,
            clientId: item.clientId,
            name: item.name,
            role: item.role,
            phone: item.phone,
            email: item.email,
            isDecisionMaker: item.isDecisionMaker,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          ['id'],
        );
      }
      counts.contacts = dto.contacts.length;
    }

    if (dto.deals?.length) {
      for (const item of dto.deals) {
        await this.deals.upsert(
          {
            id: item.id,
            clientId: item.clientId,
            sellerId: item.sellerId,
            stage: item.stage as any,
            amount: item.amount,
            probability: item.probability,
            stageHistory: item.stageHistory,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          ['id'],
        );
      }
      counts.deals = dto.deals.length;
    }

    if (dto.tasks?.length) {
      for (const item of dto.tasks) {
        await this.tasks.upsert(
          {
            id: item.id,
            sellerId: item.sellerId,
            clientId: item.clientId,
            title: item.title,
            description: item.description,
            scheduledAt: item.scheduledAt,
            completedAt: item.completedAt,
            status: item.status as any,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          ['id'],
        );
      }
      counts.tasks = dto.tasks.length;
    }

    if (dto.activities?.length) {
      for (const item of dto.activities) {
        await this.activities.upsert(
          {
            id: item.id,
            sellerId: item.sellerId,
            clientId: item.clientId,
            contactId: item.contactId,
            type: item.type as any,
            result: item.result as any,
            summary: item.summary,
            discovery: item.discovery,
            agreement: item.agreement,
            nextStep: item.nextStep,
            nextDate: item.nextDate,
            nextTime: item.nextTime,
            points: item.points,
            quality: item.quality,
            executedAt: item.executedAt,
            programmedAt: item.programmedAt,
            capturedAt: item.capturedAt,
            delayMinutes: item.delayMinutes,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          ['id'],
        );
      }
      counts.activities = dto.activities.length;
    }

    if (dto.sales?.length) {
      for (const item of dto.sales) {
        await this.sales.upsert(
          {
            id: item.id,
            sellerId: item.sellerId,
            clientId: item.clientId,
            clientName: item.clientName,
            clientType: item.clientType as 'Nuevo' | 'Existente',
            product: item.product,
            units: item.units,
            amount: item.amount,
            pay: item.pay as any,
            source: item.source as any,
            type: item.type as any,
            date: item.date,
            notes: item.notes,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          ['id'],
        );
      }
      counts.sales = dto.sales.length;
    }

    return { success: true, counts };
  }
}
