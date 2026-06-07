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
import { ExportData } from '../../domain/entities/import-export.entity';

@Injectable()
export class ExportDataUseCase {
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

  async execute(): Promise<ExportData> {
    const [sellers, users, clients, contacts, deals, tasks, activities, sales, settings] =
      await Promise.all([
        this.sellers.find(),
        this.users.find(),
        this.clients.find(),
        this.contacts.find(),
        this.deals.find(),
        this.tasks.find(),
        this.activities.find(),
        this.sales.find(),
        this.settings.find(),
      ]);

    return { sellers, users, clients, contacts, deals, tasks, activities, sales, settings };
  }
}
