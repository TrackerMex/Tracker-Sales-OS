import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { SaleTypeormEntity } from '../sales/infrastructure/entities/sale.typeorm.entity';
import { SellerTypeormEntity } from '../sellers/infrastructure/entities/seller.typeorm.entity';
import { ReportsController } from './presentation/reports.controller';
import { GetMonthlyReportUseCase } from './application/use-cases/get-monthly-report.use-case';
import { GetWinLossUseCase } from './application/use-cases/get-win-loss.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleTypeormEntity, SellerTypeormEntity]),
    AuthModule,
    PipelineModule,
  ],
  controllers: [ReportsController],
  providers: [GetMonthlyReportUseCase, GetWinLossUseCase],
})
export class ReportsModule {}
