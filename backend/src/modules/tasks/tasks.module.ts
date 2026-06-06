import { Module } from '@nestjs/common';
import { TasksController } from './presentation/tasks.controller';

@Module({
  controllers: [TasksController],
  providers: [],
  exports: [],
})
export class TasksModule {}
