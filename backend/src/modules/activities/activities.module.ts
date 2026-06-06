import { Module } from '@nestjs/common';
import { ActivitiesController } from './presentation/activities.controller';

@Module({
  controllers: [ActivitiesController],
  providers: [],
  exports: [],
})
export class ActivitiesModule {}
