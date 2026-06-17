import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { DEAL_REPOSITORY, IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { DealDto } from '../dtos/deal.dto';

type PipelineGrouped = Record<PipelineStage, DealDto[]>;

@Injectable()
export class GetPipelineTeamUseCase implements IUseCase<void, PipelineGrouped> {
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepo: IDealsRepository,
  ) {}

  async execute(): Promise<PipelineGrouped> {
    const enrichedDeals = await this.dealRepo.findDetailedAllSellers();

    const grouped: PipelineGrouped = {
      [PipelineStage.Prospecto]: [],
      [PipelineStage.Contactado]: [],
      [PipelineStage.Interesado]: [],
      [PipelineStage.Propuesta]: [],
      [PipelineStage.Negociacion]: [],
      [PipelineStage.Cierre]: [],
      [PipelineStage.Perdido]: [],
    };

    for (const row of enrichedDeals) {
      grouped[row.deal.stage].push(DealDto.fromEnrichedRow(row));
    }

    return grouped;
  }
}
