import { Module } from '@nestjs/common';
import { SalesController } from './presentation/sales.controller';

@Module({
  controllers: [SalesController],
  providers: [],
  exports: [],
})
export class SalesModule {}
