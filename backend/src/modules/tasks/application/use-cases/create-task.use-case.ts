import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { TaskDto } from '../dtos/task.dto';
import { CreateTaskDto } from '../dtos/create-task.dto';
import {
  TASK_REPOSITORY,
  ITaskRepository,
} from '../../domain/repositories/task.repository.interface';
import { TaskStatus } from '../../domain/entities/task.entity';

@Injectable()
export class CreateTaskUseCase implements IUseCase<CreateTaskDto, TaskDto> {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(input: CreateTaskDto): Promise<TaskDto> {
    const entity = await this.taskRepo.create({
      sellerId: input.sellerId,
      clientId: input.clientId ?? null,
      type: input.type ?? null,
      contactId: input.contactId ?? null,
      title: input.title,
      description: input.description ?? null,
      scheduledAt: new Date(input.scheduledAt),
      completedAt: null,
      status: TaskStatus.Pending,
    });

    return TaskDto.fromEntity(entity);
  }
}
