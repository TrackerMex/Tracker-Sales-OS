import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './presentation/sales.controller';
import { SaleTypeormEntity } from './infrastructure/entities/sale.typeorm.entity';
import { SaleRepositoryImpl } from './infrastructure/repositories/sale.repository.impl';
import { SALE_REPOSITORY } from './domain/repositories/sale.repository.interface';
import { CreateSaleUseCase } from './application/use-cases/create-sale.use-case';
import { GetSalesUseCase } from './application/use-cases/get-sales.use-case';
import { UpdateSaleUseCase } from './application/use-cases/update-sale.use-case';
import { DeleteSaleUseCase } from './application/use-cases/delete-sale.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SaleTypeormEntity]), AuthModule],
  controllers: [SalesController],
  providers: [
    { provide: SALE_REPOSITORY, useClass: SaleRepositoryImpl },
    CreateSaleUseCase,
    GetSalesUseCase,
    UpdateSaleUseCase,
    DeleteSaleUseCase,
  ],
  exports: [SALE_REPOSITORY],
})
export class SalesModule {}
