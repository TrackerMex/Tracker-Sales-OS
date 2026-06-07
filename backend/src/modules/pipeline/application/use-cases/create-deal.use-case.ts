import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { DEAL_REPOSITORY, IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { STAGE_PROBABILITY } from '../../domain/entities/deal.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { CreateDealDto } from '../dtos/create-deal.dto';
import { DealDto } from '../dtos/deal.dto';

@Injectable()
export class CreateDealUseCase implements IUseCase<CreateDealDto, DealDto> {
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepo: IDealsRepository,
  ) {}

  async execute(input: CreateDealDto): Promise<DealDto> {
    const stage = input.stage ?? PipelineStage.Prospecto;
    const probability = STAGE_PROBABILITY[stage];

    const entity = await this.dealRepo.create({
      clientId: input.clientId,
      sellerId: input.sellerId,
      stage,
      amount: input.amount ?? 0,
      probability,
      stageHistory: [],
    });

    return DealDto.fromEntity(entity);
  }
}
