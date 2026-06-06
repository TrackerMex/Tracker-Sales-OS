import { Module } from '@nestjs/common';
import { SellersController } from './presentation/sellers.controller';

@Module({
  controllers: [SellersController],
  providers: [],
  exports: [],
})
export class SellersModule {}
