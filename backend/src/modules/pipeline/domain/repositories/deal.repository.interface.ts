import { IRepository } from '../../../../core/domain/repository.interface';
import { DealEntity } from '../entities/deal.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export const DEAL_REPOSITORY = 'DEAL_REPOSITORY';

export interface IDealsRepository extends IRepository<DealEntity> {
  findBySellerId(sellerId: string): Promise<DealEntity[]>;
  findByStage(stage: PipelineStage): Promise<DealEntity[]>;
}
