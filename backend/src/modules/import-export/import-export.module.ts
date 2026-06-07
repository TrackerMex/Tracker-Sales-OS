import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SellerTypeormEntity } from '../sellers/infrastructure/entities/seller.typeorm.entity';
import { UserTypeormEntity } from '../auth/infrastructure/entities/user.typeorm.entity';
import { ClientTypeormEntity } from '../clients/infrastructure/entities/client.typeorm.entity';
import { ContactTypeormEntity } from '../clients/infrastructure/entities/contact.typeorm.entity';
import { DealTypeormEntity } from '../pipeline/infrastructure/entities/deal.typeorm.entity';
import { TaskTypeormEntity } from '../tasks/infrastructure/entities/task.typeorm.entity';
import { ActivityTypeormEntity } from '../activities/infrastructure/entities/activity.typeorm.entity';
import { SaleTypeormEntity } from '../sales/infrastructure/entities/sale.typeorm.entity';
import { SettingTypeormEntity } from '../settings/infrastructure/entities/setting.typeorm.entity';
import { ImportExportController } from './presentation/import-export.controller';
import { ExportDataUseCase } from './application/use-cases/export-data.use-case';
import { ImportDataUseCase } from './application/use-cases/import-data.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SellerTypeormEntity,
      UserTypeormEntity,
      ClientTypeormEntity,
      ContactTypeormEntity,
      DealTypeormEntity,
      TaskTypeormEntity,
      ActivityTypeormEntity,
      SaleTypeormEntity,
      SettingTypeormEntity,
    ]),
    AuthModule,
  ],
  controllers: [ImportExportController],
  providers: [ExportDataUseCase, ImportDataUseCase],
})
export class ImportExportModule {}
