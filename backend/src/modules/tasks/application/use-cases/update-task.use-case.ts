import { Injectable, Inject, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { TaskDto } from '../dtos/task.dto';
import { TASK_REPOSITORY, ITaskRepository } from '../../domain/repositories/task.repository.interface';

export interface UpdateTaskInput {
  taskId: string;
  sellerId: string;
  clientId?: string;
  type?: string;
  contactId?: string;
  title?: string;
  description?: string;
  scheduledAt?: string;
}

@Injectable()
export class UpdateTaskUseCase implements IUseCase<UpdateTaskInput, TaskDto> {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(input: UpdateTaskInput): Promise<TaskDto> {
    const task = await this.taskRepo.findById(input.taskId);

    if (!task) throw new NotFoundException(`Task ${input.taskId} not found`);
    if (task.sellerId !== input.sellerId) throw new ForbiddenException('You can only edit your own tasks');

    if (input.scheduledAt) {
      const newScheduledAt = new Date(input.scheduledAt);
      const conflict = await this.taskRepo.findConflictingTask(input.sellerId, newScheduledAt, input.taskId);
      if (conflict) {
        const fecha = newScheduledAt.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hora = newScheduledAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
        throw new ConflictException(
          `Ya tienes una tarea programada para el ${fecha} a las ${hora}: "${conflict.title}"`,
        );
      }
    }

    const { taskId, sellerId, ...fields } = input;

    const updated = await this.taskRepo.update(taskId, {
      ...fields,
      scheduledAt: fields.scheduledAt ? new Date(fields.scheduledAt) : undefined,
    });

    return TaskDto.fromEntity(updated);
  }
}
