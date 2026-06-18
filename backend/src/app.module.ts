import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { UsersModule } from './modules/users/users.module';
import { ImportExportModule } from './modules/import-export/import-export.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER', 'tracker'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB', 'tracker_sales_os'),
        autoLoadEntities: true,
        synchronize:
          config.get<string>('TYPEORM_SYNCHRONIZE', 'false') === 'true',
        logging: config.get<string>('TYPEORM_LOGGING', 'false') === 'true',
        ssl: false,
        extra: {
          max: 20,
          min: 2,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        },
      }),
    }),
    AuthModule,
    SellersModule,
    UsersModule,
    ClientsModule,
    ActivitiesModule,
    TasksModule,
    PipelineModule,
    SalesModule,
    CoachingModule,
    ReportsModule,
    SettingsModule,
    DashboardModule,
    ImportExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
