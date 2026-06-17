import { IRepository } from '../../../../core/domain/repository.interface';
import { DealEntity } from '../entities/deal.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export const DEAL_REPOSITORY = 'DEAL_REPOSITORY';

export interface IDealsRepository extends IRepository<DealEntity> {
  findBySellerId(sellerId: string): Promise<DealEntity[]>;
  findByStage(stage: PipelineStage): Promise<DealEntity[]>;
  findByClientIdAndSellerId(clientId: string, sellerId: string): Promise<DealEntity | null>;
  findDetailedBySellerId(sellerId: string): Promise<{
    deal: DealEntity;
    clientName: string;
    contactName: string | null;
    contactRole: string | null;
    painPoint: string | null;
    sellerName: string | null;
    clientNextStep: string | null;
    clientNextDate: string | null;
    clientNextTime: string | null;
  }[]>;
  findDetailedAllSellers(): Promise<{
    deal: DealEntity;
    clientName: string;
    contactName: string | null;
    contactRole: string | null;
    painPoint: string | null;
    sellerName: string | null;
    clientNextStep: string | null;
    clientNextDate: string | null;
    clientNextTime: string | null;
  }[]>;
  getWeightedForecast(): Promise<number>;
  findStalledDeals(amberDays: number): Promise<{ deal: DealEntity; daysStalled: number }[]>;
  findAllForAnalysis(): Promise<DealEntity[]>;
}
