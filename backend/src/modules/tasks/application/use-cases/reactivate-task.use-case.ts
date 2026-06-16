import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { TaskDto } from '../dtos/task.dto';
import { TASK_REPOSITORY, ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { TaskStatus } from '../../domain/entities/task.entity';

export interface ReactivateTaskInput {
  taskId: string;
  sellerId: string;
}

@Injectable()
export class ReactivateTaskUseCase implements IUseCase<ReactivateTaskInput, TaskDto> {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(input: ReactivateTaskInput): Promise<TaskDto> {
    const task = await this.taskRepo.findById(input.taskId);

    if (!task) throw new NotFoundException(`Task ${input.taskId} not found`);
    if (task.sellerId !== input.sellerId) throw new ForbiddenException('You can only reactivate your own tasks');

    const updated = await this.taskRepo.update(input.taskId, {
      status: TaskStatus.Pending,
      completedAt: null,
    });

    return TaskDto.fromEntity(updated);
  }
}
