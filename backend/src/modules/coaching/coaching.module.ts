import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ActivityTypeormEntity } from '../activities/infrastructure/entities/activity.typeorm.entity';
import { TaskTypeormEntity } from '../tasks/infrastructure/entities/task.typeorm.entity';
import { SellerTypeormEntity } from '../sellers/infrastructure/entities/seller.typeorm.entity';
import { CoachingController } from './presentation/coaching.controller';
import { GetCoachingDailyUseCase } from './application/use-cases/get-coaching-daily.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityTypeormEntity,
      TaskTypeormEntity,
      SellerTypeormEntity,
    ]),
    AuthModule,
  ],
  controllers: [CoachingController],
  providers: [GetCoachingDailyUseCase],
})
export class CoachingModule {}
