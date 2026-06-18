import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { ActivityDto } from '../dtos/activity.dto';
import { CreateActivityDto } from '../dtos/create-activity.dto';
import { ACTIVITY_REPOSITORY, IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { TASK_POINTS, REQUIRES_NEXT_STEP } from '../../domain/entities/activity.entity';
import { DEAL_REPOSITORY, IDealsRepository } from '../../../pipeline/domain/repositories/deal.repository.interface';
import { ALLOWED_TRANSITIONS, STAGE_PROBABILITY } from '../../../pipeline/domain/entities/deal.entity';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';

@Injectable()
export class CreateActivityUseCase implements IUseCase<CreateActivityDto, ActivityDto> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: IActivityRepository,
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepo: IDealsRepository,
  ) {}

  async execute(input: CreateActivityDto): Promise<ActivityDto> {
    if (REQUIRES_NEXT_STEP.has(input.type)) {
      if (!input.nextStep || !input.nextDate || !input.nextTime) {
        throw new BadRequestException(
          `Type ${input.type} requires nextStep, nextDate and nextTime`,
        );
      }
    }

    const capturedAt = new Date();
    const executedAt = new Date(input.executedAt);
    const delayMinutes = Math.round((capturedAt.getTime() - executedAt.getTime()) / 60000);
    const points = TASK_POINTS[input.type];
    const quality = this.calculateQuality(input);

    // Stage snapshot + conditional pipeline sync
    let resolvedStage: string | null = input.stage ?? null;

    if (input.clientId) {
      const existingDeal = input.opportunityName
        ? await this.dealRepo.findByOpportunity(input.clientId, input.sellerId, input.opportunityName)
        : await this.dealRepo.findByClientIdAndSellerId(input.clientId, input.sellerId);

      if (existingDeal && !input.stage) {
        // Auto-snapshot: usar stage actual del deal sin avanzarlo
        resolvedStage = existingDeal.stage;
      }

      if (input.stage) {
        if (!existingDeal) {
          // Crear nuevo deal (con o sin opportunityName)
          await this.syncPipeline(input.clientId, input.sellerId, input.stage, input.opportunityName);
        } else if (input.stage !== existingDeal.stage) {
          // Avanzar SOLO el deal de esta oportunidad
          await this.syncPipelineForDeal(existingDeal.id, input.stage, input.sellerId);
        }
        // Si input.stage === existingDeal.stage → no avanzar, solo snapshot
      }
    }

    const entity = await this.activityRepo.create({
      ...input,
      clientId: input.clientId ?? null,
      contactId: input.contactId ?? null,
      taskId: input.taskId ?? null,
      discovery: input.discovery ?? null,
      agreement: input.agreement ?? null,
      nextStep: input.nextStep ?? null,
      nextObjective: input.nextObjective ?? null,
      nextDate: input.nextDate ?? null,
      nextTime: input.nextTime ?? null,
      stage: resolvedStage,
      programmedAt: input.programmedAt ? new Date(input.programmedAt) : null,
      executedAt,
      capturedAt,
      delayMinutes,
      points,
      quality,
    });

    return ActivityDto.fromEntity(entity);
  }

  private async syncPipeline(clientId: string, sellerId: string, stage: PipelineStage, opportunityName?: string): Promise<void> {
    await this.dealRepo.create({
      clientId,
      sellerId,
      stage,
      amount: 0,
      probability: STAGE_PROBABILITY[stage],
      stageHistory: [],
      opportunityName: opportunityName ?? null,
    });
  }

  private async syncPipelineForDeal(dealId: string, stage: PipelineStage, sellerId: string): Promise<void> {
    const deal = await this.dealRepo.findById(dealId);
    if (!deal) return;
    const allowed = ALLOWED_TRANSITIONS[deal.stage] ?? [];
    if (!allowed.includes(stage)) return;
    await this.dealRepo.update(dealId, {
      stage,
      probability: STAGE_PROBABILITY[stage],
      stageHistory: [
        ...deal.stageHistory,
        { stage, changedAt: new Date().toISOString(), changedBy: sellerId },
      ],
    });
  }

  private calculateQuality(input: CreateActivityDto): number {
    let score = 0;
    if ((input.summary?.length ?? 0) > 20) score += 20;
    if ((input.discovery?.length ?? 0) > 15) score += 20;
    if ((input.agreement?.length ?? 0) > 15) score += 20;
    if ((input.nextStep?.length ?? 0) > 8) score += 20;
    if (input.nextDate && input.nextTime) score += 20;
    return score;
  }
}
