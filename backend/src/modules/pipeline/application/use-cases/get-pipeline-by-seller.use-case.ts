import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { DEAL_REPOSITORY, IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { DealDto } from '../dtos/deal.dto';

interface GetPipelineBySellerInput {
  sellerId: string;
}

type PipelineGrouped = Record<PipelineStage, DealDto[]>;

@Injectable()
export class GetPipelineBySellerUseCase
  implements IUseCase<GetPipelineBySellerInput, PipelineGrouped>
{
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepo: IDealsRepository,
  ) {}

  async execute(input: GetPipelineBySellerInput): Promise<PipelineGrouped> {
    const deals = await this.dealRepo.findBySellerId(input.sellerId);

    const grouped: PipelineGrouped = {
      [PipelineStage.Prospecto]: [],
      [PipelineStage.Contactado]: [],
      [PipelineStage.Interesado]: [],
      [PipelineStage.Propuesta]: [],
      [PipelineStage.Negociacion]: [],
      [PipelineStage.Cierre]: [],
      [PipelineStage.Perdido]: [],
    };

    for (const deal of deals) {
      grouped[deal.stage].push(DealDto.fromEntity(deal));
    }

    return grouped;
  }
}
