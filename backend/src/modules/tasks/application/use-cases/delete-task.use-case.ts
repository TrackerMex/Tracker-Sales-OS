import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  TASK_REPOSITORY,
  ITaskRepository,
} from '../../domain/repositories/task.repository.interface';

export interface DeleteTaskInput {
  taskId: string;
  sellerId: string;
}

@Injectable()
export class DeleteTaskUseCase implements IUseCase<DeleteTaskInput, void> {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(input: DeleteTaskInput): Promise<void> {
    const task = await this.taskRepo.findById(input.taskId);

    if (!task) {
      throw new NotFoundException(`Task ${input.taskId} not found`);
    }

    if (task.sellerId !== input.sellerId) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    await this.taskRepo.softDelete(input.taskId);
  }
}
