import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SellersController } from './presentation/sellers.controller';
import { SellerTypeormEntity } from './infrastructure/entities/seller.typeorm.entity';
import { SellerRepositoryImpl } from './infrastructure/repositories/seller.repository.impl';
import { SELLER_REPOSITORY } from './domain/repositories/seller.repository.interface';
import { GetSellersUseCase } from './application/use-cases/get-sellers.use-case';
import { CreateSellerUseCase } from './application/use-cases/create-seller.use-case';
import { DeactivateSellerUseCase } from './application/use-cases/deactivate-seller.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([SellerTypeormEntity]), AuthModule],
  controllers: [SellersController],
  providers: [
    { provide: SELLER_REPOSITORY, useClass: SellerRepositoryImpl },
    GetSellersUseCase,
    CreateSellerUseCase,
    DeactivateSellerUseCase,
  ],
  exports: [SELLER_REPOSITORY],
})
export class SellersModule {}
