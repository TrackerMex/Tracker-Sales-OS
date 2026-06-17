import { Injectable, Inject, ConflictException } from '@nestjs/common';
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
    const scheduledAt = new Date(input.scheduledAt);
    const conflict = await this.taskRepo.findConflictingTask(input.sellerId, scheduledAt);
    if (conflict) {
      const fecha = scheduledAt.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora = scheduledAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
      throw new ConflictException(
        `Ya tienes una tarea programada para el ${fecha} a las ${hora}: "${conflict.title}"`,
      );
    }

    const entity = await this.taskRepo.create({
      sellerId: input.sellerId,
      clientId: input.clientId ?? null,
      type: input.type ?? null,
      contactId: input.contactId ?? null,
      title: input.title,
      description: input.description ?? null,
      scheduledAt,
      completedAt: null,
      status: TaskStatus.Pending,
    });

    return TaskDto.fromEntity(entity);
  }
}
