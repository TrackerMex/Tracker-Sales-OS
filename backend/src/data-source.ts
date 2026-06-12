import { DataSource } from 'typeorm';
import { ActivityTypeormEntity } from './modules/activities/infrastructure/entities/activity.typeorm.entity';
import { DealTypeormEntity } from './modules/pipeline/infrastructure/entities/deal.typeorm.entity';
import { ClientTypeormEntity } from './modules/clients/infrastructure/entities/client.typeorm.entity';
import { ContactTypeormEntity } from './modules/clients/infrastructure/entities/contact.typeorm.entity';
import { UserTypeormEntity } from './modules/auth/infrastructure/entities/user.typeorm.entity';
import { SellerTypeormEntity } from './modules/sellers/infrastructure/entities/seller.typeorm.entity';
import { TaskTypeormEntity } from './modules/tasks/infrastructure/entities/task.typeorm.entity';
import { SaleTypeormEntity } from './modules/sales/infrastructure/entities/sale.typeorm.entity';
import { SettingTypeormEntity } from './modules/settings/infrastructure/entities/setting.typeorm.entity';
import { AuditLogTypeormEntity } from './core/infrastructure/entities/audit-log.typeorm.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || 'tracker',
  password: process.env.POSTGRES_PASSWORD || 'tracker123',
  database: process.env.POSTGRES_DB || 'tracker_sales_os',
  entities: [
    ActivityTypeormEntity,
    DealTypeormEntity,
    ClientTypeormEntity,
    ContactTypeormEntity,
    UserTypeormEntity,
    SellerTypeormEntity,
    TaskTypeormEntity,
    SaleTypeormEntity,
    SettingTypeormEntity,
    AuditLogTypeormEntity,
  ],
  migrations: ['src/migrations/*.ts'],
});
