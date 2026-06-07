import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityTypeormEntity } from './infrastructure/entities/activity.typeorm.entity';
import { ActivityRepositoryImpl } from './infrastructure/repositories/activity.repository.impl';
import { ACTIVITY_REPOSITORY } from './domain/repositories/activity.repository.interface';
import { CreateActivityUseCase } from './application/use-cases/create-activity.use-case';
import { GetDailyActivitiesUseCase } from './application/use-cases/get-daily-activities.use-case';
import { GetSellerActivitiesUseCase } from './application/use-cases/get-seller-activities.use-case';
import { ActivitiesController } from './presentation/activities.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityTypeormEntity]), AuthModule],
  controllers: [ActivitiesController],
  providers: [
    { provide: ACTIVITY_REPOSITORY, useClass: ActivityRepositoryImpl },
    CreateActivityUseCase,
    GetDailyActivitiesUseCase,
    GetSellerActivitiesUseCase,
  ],
  exports: [ACTIVITY_REPOSITORY],
})
export class ActivitiesModule {}
