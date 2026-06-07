import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { TaskDto } from '../dtos/task.dto';
import {
  TASK_REPOSITORY,
  ITaskRepository,
} from '../../domain/repositories/task.repository.interface';
import { TaskStatus } from '../../domain/entities/task.entity';

export interface CompleteTaskInput {
  taskId: string;
  sellerId: string;
}

@Injectable()
export class CompleteTaskUseCase implements IUseCase<
  CompleteTaskInput,
  TaskDto
> {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(input: CompleteTaskInput): Promise<TaskDto> {
    const task = await this.taskRepo.findById(input.taskId);

    if (!task) {
      throw new NotFoundException(`Task ${input.taskId} not found`);
    }

    if (task.sellerId !== input.sellerId) {
      throw new ForbiddenException('You can only complete your own tasks');
    }

    const updated = await this.taskRepo.update(input.taskId, {
      status: TaskStatus.Completed,
      completedAt: new Date(),
    });

    return TaskDto.fromEntity(updated);
  }
}
