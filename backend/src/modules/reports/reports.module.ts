import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SaleTypeormEntity } from '../sales/infrastructure/entities/sale.typeorm.entity';
import { SellerTypeormEntity } from '../sellers/infrastructure/entities/seller.typeorm.entity';
import { ReportsController } from './presentation/reports.controller';
import { GetMonthlyReportUseCase } from './application/use-cases/get-monthly-report.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleTypeormEntity, SellerTypeormEntity]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [GetMonthlyReportUseCase],
})
export class ReportsModule {}
