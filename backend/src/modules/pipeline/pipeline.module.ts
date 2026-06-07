import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealTypeormEntity } from './infrastructure/entities/deal.typeorm.entity';
import { DealRepositoryImpl } from './infrastructure/repositories/deal.repository.impl';
import { DEAL_REPOSITORY } from './domain/repositories/deal.repository.interface';
import { CreateDealUseCase } from './application/use-cases/create-deal.use-case';
import { GetPipelineBySellerUseCase } from './application/use-cases/get-pipeline-by-seller.use-case';
import { ChangeDealStageUseCase } from './application/use-cases/change-deal-stage.use-case';
import {
  PipelineController,
  DealsController,
} from './presentation/pipeline.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DealTypeormEntity]), AuthModule],
  controllers: [PipelineController, DealsController],
  providers: [
    { provide: DEAL_REPOSITORY, useClass: DealRepositoryImpl },
    CreateDealUseCase,
    GetPipelineBySellerUseCase,
    ChangeDealStageUseCase,
  ],
  exports: [DEAL_REPOSITORY],
})
export class PipelineModule {}
