import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskTypeormEntity } from './infrastructure/entities/task.typeorm.entity';
import { TaskRepositoryImpl } from './infrastructure/repositories/task.repository.impl';
import { TASK_REPOSITORY } from './domain/repositories/task.repository.interface';
import { CreateTaskUseCase } from './application/use-cases/create-task.use-case';
import { GetTodayTasksUseCase } from './application/use-cases/get-today-tasks.use-case';
import { CompleteTaskUseCase } from './application/use-cases/complete-task.use-case';
import { UpdateTaskUseCase } from './application/use-cases/update-task.use-case';
import { ReactivateTaskUseCase } from './application/use-cases/reactivate-task.use-case';
import { TasksController } from './presentation/tasks.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaskTypeormEntity]), AuthModule],
  controllers: [TasksController],
  providers: [
    { provide: TASK_REPOSITORY, useClass: TaskRepositoryImpl },
    CreateTaskUseCase,
    GetTodayTasksUseCase,
    CompleteTaskUseCase,
    UpdateTaskUseCase,
    ReactivateTaskUseCase,
  ],
  exports: [TASK_REPOSITORY],
})
export class TasksModule {}
