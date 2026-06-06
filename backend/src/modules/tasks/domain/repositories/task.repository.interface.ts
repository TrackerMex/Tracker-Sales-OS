import { IRepository } from '../../../../core/domain/repository.interface';
import { TaskEntity } from '../entities/task.entity';

export const TASK_REPOSITORY = 'TASK_REPOSITORY';

export interface ITaskRepository extends IRepository<TaskEntity> {
  findTodayBySeller(sellerId: string): Promise<TaskEntity[]>;
  findTomorrowBySeller(sellerId: string): Promise<TaskEntity[]>;
  findOverdueBySeller(sellerId: string): Promise<TaskEntity[]>;
}
