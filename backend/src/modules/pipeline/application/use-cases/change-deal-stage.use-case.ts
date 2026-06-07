import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { DEAL_REPOSITORY, IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import {
  ALLOWED_TRANSITIONS,
  STAGE_PROBABILITY,
  StageHistoryEntry,
} from '../../domain/entities/deal.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { DealDto } from '../dtos/deal.dto';

interface ChangeDealStageInput {
  id: string;
  newStage: PipelineStage;
  changedBy: string;
}

@Injectable()
export class ChangeDealStageUseCase
  implements IUseCase<ChangeDealStageInput, DealDto>
{
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepo: IDealsRepository,
  ) {}

  async execute(input: ChangeDealStageInput): Promise<DealDto> {
    const deal = await this.dealRepo.findById(input.id);
    if (!deal) {
      throw new NotFoundException(`Deal ${input.id} not found`);
    }

    const allowed = ALLOWED_TRANSITIONS[deal.stage] ?? [];
    if (!allowed.includes(input.newStage)) {
      throw new BadRequestException(
        `Transition from ${deal.stage} to ${input.newStage} is not allowed`,
      );
    }

    const historyEntry: StageHistoryEntry = {
      stage: input.newStage,
      changedAt: new Date().toISOString(),
      changedBy: input.changedBy,
    };

    const updated = await this.dealRepo.update(input.id, {
      stage: input.newStage,
      probability: STAGE_PROBABILITY[input.newStage],
      stageHistory: [...deal.stageHistory, historyEntry],
    });

    return DealDto.fromEntity(updated);
  }
}
