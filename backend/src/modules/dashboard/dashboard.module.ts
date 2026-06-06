import { Module } from '@nestjs/common';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [],
  exports: [],
})
export class DashboardModule {}
