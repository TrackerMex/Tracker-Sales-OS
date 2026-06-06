import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { SalesModule } from './modules/sales/sales.module';
import { CoachingModule } from './modules/coaching/coaching.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    // TODO (feature 01-infra-setup): add TypeOrmModule.forRootAsync with env config
    // TODO (feature 01-infra-setup): add ThrottlerModule, ConfigModule
    AuthModule,
    SellersModule,
    ClientsModule,
    ActivitiesModule,
    TasksModule,
    PipelineModule,
    SalesModule,
    CoachingModule,
    ReportsModule,
    SettingsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
