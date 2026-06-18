import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { ActivityDto } from '../dtos/activity.dto';
import { ACTIVITY_REPOSITORY, IActivityRepository } from '../../domain/repositories/activity.repository.interface';

export interface UpdateActivityStatusInput {
  id: string;
  newStatus: string;
  changedBy: string;
  comment?: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  'Pendiente': ['En curso', 'Cancelada'],
  'En curso': ['Completada', 'Cancelada'],
  'Completada': [],
  'Cancelada': [],
};

@Injectable()
export class UpdateActivityStatusUseCase implements IUseCase<UpdateActivityStatusInput, ActivityDto> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: IActivityRepository,
  ) {}

  async execute(input: UpdateActivityStatusInput): Promise<ActivityDto> {
    const activity = await this.activityRepo.findById(input.id);
    if (!activity) throw new NotFoundException('Activity not found');

    const currentStatus = activity.status ?? 'Pendiente';
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(input.newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${currentStatus}" to "${input.newStatus}"`,
      );
    }

    const historyEntry = {
      changedAt: new Date().toISOString(),
      oldStatus: currentStatus,
      newStatus: input.newStatus,
      changedBy: input.changedBy,
      comment: input.comment,
    };

    const updated = await this.activityRepo.updateStatus(input.id, input.newStatus, historyEntry);
    return ActivityDto.fromEntity(updated);
  }
}
