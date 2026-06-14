import { PipelineStage } from '../../../clients/domain/entities/client.entity';

export interface FunnelStageDto {
  stage: PipelineStage;
  reached: number;
  conversionFromPrevious: number;
  avgDaysInStage: number;
}

export interface LossByOriginDto {
  originStage: PipelineStage;
  count: number;
  percentage: number;
}

export interface LossReasonDto {
  reason: string;
  count: number;
}

export class WinLossReportDto {
  totalDeals: number;
  won: number;
  lost: number;
  open: number;
  winRate: number;
  funnel: FunnelStageDto[];
  lossesByOrigin: LossByOriginDto[];
  lossReasons: LossReasonDto[];
}
