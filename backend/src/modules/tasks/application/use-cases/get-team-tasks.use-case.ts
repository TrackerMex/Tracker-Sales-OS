import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { TaskDto } from '../dtos/task.dto';
import {
  TASK_REPOSITORY,
  ITaskRepository,
} from '../../domain/repositories/task.repository.interface';

export interface GetTeamTasksInput {
  date?: string;
}

@Injectable()
export class GetTeamTasksUseCase implements IUseCase<GetTeamTasksInput, TaskDto[]> {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(input: GetTeamTasksInput): Promise<TaskDto[]> {
    const date = input.date ? new Date(input.date) : new Date();
    const entities = await this.taskRepo.findMonthAllSellers(date);
    return entities.map(TaskDto.fromEntity);
  }
}
