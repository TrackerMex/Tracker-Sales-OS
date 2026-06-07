import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { CreateTaskUseCase } from '../application/use-cases/create-task.use-case';
import { GetTodayTasksUseCase } from '../application/use-cases/get-today-tasks.use-case';
import { CompleteTaskUseCase } from '../application/use-cases/complete-task.use-case';
import { CreateTaskDto } from '../application/dtos/create-task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly getTodayTasks: GetTodayTasksUseCase,
    private readonly completeTask: CompleteTaskUseCase,
  ) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Create a new task' })
  create(@Body() dto: CreateTaskDto) {
    return this.createTask.execute(dto);
  }

  @Get('seller/:id/today')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get today tasks for a seller' })
  getToday(@Param('id') sellerId: string, @Query('date') date?: string) {
    return this.getTodayTasks.execute({ sellerId, date });
  }

  @Patch(':id/complete')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Mark a task as completed' })
  complete(@Param('id') taskId: string, @Body('sellerId') sellerId: string) {
    return this.completeTask.execute({ taskId, sellerId });
  }
}
