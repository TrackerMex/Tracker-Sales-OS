import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  DEAL_REPOSITORY,
  IDealsRepository,
} from '../../../pipeline/domain/repositories/deal.repository.interface';
import { DealEntity } from '../../../pipeline/domain/entities/deal.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import {
  WinLossReportDto,
  FunnelStageDto,
  LossByOriginDto,
  LossReasonDto,
} from '../dtos/win-loss.dto';

const ORDER: PipelineStage[] = [
  PipelineStage.Prospecto,
  PipelineStage.Contactado,
  PipelineStage.Interesado,
  PipelineStage.Propuesta,
  PipelineStage.Negociacion,
  PipelineStage.Cierre,
];

const round = (n: number): number => Math.round(n);
const round1 = (n: number): number => Math.round(n * 10) / 10;

@Injectable()
export class GetWinLossUseCase implements IUseCase<void, WinLossReportDto> {
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepo: IDealsRepository,
  ) {}

  async execute(): Promise<WinLossReportDto> {
    const deals = await this.dealRepo.findAllForAnalysis();

    const idx = (stage: PipelineStage): number => ORDER.indexOf(stage);

    const totalDeals = deals.length;
    const won = deals.filter((d) => d.stage === PipelineStage.Cierre).length;
    const lost = deals.filter((d) => d.stage === PipelineStage.Perdido).length;
    const open = totalDeals - won - lost;
    const winRate = won + lost === 0 ? 0 : round((won / (won + lost)) * 100);

    // Most advanced non-Perdido stage reached per deal
    const maxStageOf = (deal: DealEntity): PipelineStage => {
      if (deal.stage !== PipelineStage.Perdido) return deal.stage;
      return this.originStage(deal);
    };

    const maxIdxByDeal = deals.map((d) => idx(maxStageOf(d)));

    // reached[i] = deals whose maxStage index >= i (sequential transitions)
    const reached = ORDER.map(
      (_, i) => maxIdxByDeal.filter((mi) => mi >= i).length,
    );

    // avgDaysInStage from consecutive stageHistory pairs
    const dwellSum: Record<string, number> = {};
    const dwellCount: Record<string, number> = {};
    for (const deal of deals) {
      const hist = deal.stageHistory ?? [];
      for (let k = 0; k < hist.length - 1; k++) {
        const stage = hist[k].stage;
        const days =
          (new Date(hist[k + 1].changedAt).getTime() -
            new Date(hist[k].changedAt).getTime()) /
          86400000;
        dwellSum[stage] = (dwellSum[stage] ?? 0) + days;
        dwellCount[stage] = (dwellCount[stage] ?? 0) + 1;
      }
    }

    const funnel: FunnelStageDto[] = ORDER.map((stage, i) => {
      const prev = reached[i - 1];
      const conversionFromPrevious =
        i === 0 || !prev ? 0 : round((reached[i] / prev) * 100);
      const count = dwellCount[stage] ?? 0;
      const avgDaysInStage = count > 0 ? round1(dwellSum[stage] / count) : 0;
      return {
        stage,
        reached: reached[i],
        conversionFromPrevious,
        avgDaysInStage,
      };
    });

    // Losses grouped by origin stage
    const lostDeals = deals.filter((d) => d.stage === PipelineStage.Perdido);
    const originCounts = new Map<PipelineStage, number>();
    for (const deal of lostDeals) {
      const origin = this.originStage(deal);
      originCounts.set(origin, (originCounts.get(origin) ?? 0) + 1);
    }
    const lossesByOrigin: LossByOriginDto[] = [...originCounts.entries()]
      .map(([originStage, count]) => ({
        originStage,
        count,
        percentage: lost === 0 ? 0 : round((count / lost) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Loss reasons from the Perdido stageHistory entry
    const reasonCounts = new Map<string, number>();
    for (const deal of lostDeals) {
      const hist = deal.stageHistory ?? [];
      const last = hist[hist.length - 1];
      const reason = last?.lossReason ?? 'sin especificar';
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
    const lossReasons: LossReasonDto[] = [...reasonCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalDeals,
      won,
      lost,
      open,
      winRate,
      funnel,
      lossesByOrigin,
      lossReasons,
    };
  }

  // Last non-Perdido stage in stageHistory; Prospecto when insufficient data.
  private originStage(deal: DealEntity): PipelineStage {
    const hist = deal.stageHistory ?? [];
    for (let k = hist.length - 1; k >= 0; k--) {
      if (hist[k].stage !== PipelineStage.Perdido) return hist[k].stage;
    }
    return PipelineStage.Prospecto;
  }
}
