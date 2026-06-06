import { Module } from '@nestjs/common';
import { CoachingController } from './presentation/coaching.controller';

@Module({
  controllers: [CoachingController],
  providers: [],
  exports: [],
})
export class CoachingModule {}
