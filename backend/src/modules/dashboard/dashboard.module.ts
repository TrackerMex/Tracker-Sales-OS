import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { ActivityTypeormEntity } from '../activities/infrastructure/entities/activity.typeorm.entity';
import { TaskTypeormEntity } from '../tasks/infrastructure/entities/task.typeorm.entity';
import { SaleTypeormEntity } from '../sales/infrastructure/entities/sale.typeorm.entity';
import { SellerTypeormEntity } from '../sellers/infrastructure/entities/seller.typeorm.entity';
import { ClientTypeormEntity } from '../clients/infrastructure/entities/client.typeorm.entity';
import { DashboardController } from './presentation/dashboard.controller';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import { GetSellersScoreUseCase } from './application/use-cases/get-sellers-score.use-case';
import { GetOverdueTasksUseCase } from './application/use-cases/get-overdue-tasks.use-case';
import { GetMiDiaUseCase } from './application/use-cases/get-mi-dia.use-case';
import { GetActivityTrendUseCase } from './application/use-cases/get-activity-trend.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityTypeormEntity,
      TaskTypeormEntity,
      SaleTypeormEntity,
      SellerTypeormEntity,
      ClientTypeormEntity,
    ]),
    AuthModule,
    SettingsModule,
  ],
  controllers: [DashboardController],
  providers: [
    GetDashboardSummaryUseCase,
    GetSellersScoreUseCase,
    GetOverdueTasksUseCase,
    GetMiDiaUseCase,
    GetActivityTrendUseCase,
  ],
})
export class DashboardModule {}
