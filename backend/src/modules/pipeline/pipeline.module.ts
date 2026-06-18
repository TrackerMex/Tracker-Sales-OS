import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealTypeormEntity } from './infrastructure/entities/deal.typeorm.entity';
import { AuditLogTypeormEntity } from '../../core/infrastructure/entities/audit-log.typeorm.entity';
import { ClientTypeormEntity } from '../clients/infrastructure/entities/client.typeorm.entity';
import { ContactTypeormEntity } from '../clients/infrastructure/entities/contact.typeorm.entity';
import { SellerTypeormEntity } from '../sellers/infrastructure/entities/seller.typeorm.entity';
import { DealRepositoryImpl } from './infrastructure/repositories/deal.repository.impl';
import { DEAL_REPOSITORY } from './domain/repositories/deal.repository.interface';
import { CreateDealUseCase } from './application/use-cases/create-deal.use-case';
import { GetPipelineBySellerUseCase } from './application/use-cases/get-pipeline-by-seller.use-case';
import { GetPipelineTeamUseCase } from './application/use-cases/get-pipeline-team.use-case';
import { ChangeDealStageUseCase } from './application/use-cases/change-deal-stage.use-case';
import { GetClientDealsUseCase } from './application/use-cases/get-client-deals.use-case';
import {
  PipelineController,
  DealsController,
} from './presentation/pipeline.controller';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DealTypeormEntity,
      AuditLogTypeormEntity,
      ClientTypeormEntity,
      ContactTypeormEntity,
      SellerTypeormEntity,
    ]),
    AuthModule,
    ClientsModule,
  ],
  controllers: [PipelineController, DealsController],
  providers: [
    { provide: DEAL_REPOSITORY, useClass: DealRepositoryImpl },
    CreateDealUseCase,
    GetPipelineBySellerUseCase,
    GetPipelineTeamUseCase,
    ChangeDealStageUseCase,
    GetClientDealsUseCase,
  ],
  exports: [DEAL_REPOSITORY, GetPipelineTeamUseCase],
})
export class PipelineModule {}
