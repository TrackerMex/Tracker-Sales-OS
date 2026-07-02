import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { CreateTaskUseCase } from '../application/use-cases/create-task.use-case';
import { GetTodayTasksUseCase } from '../application/use-cases/get-today-tasks.use-case';
import { GetTeamTasksUseCase } from '../application/use-cases/get-team-tasks.use-case';
import { CompleteTaskUseCase } from '../application/use-cases/complete-task.use-case';
import { UpdateTaskUseCase } from '../application/use-cases/update-task.use-case';
import { ReactivateTaskUseCase } from '../application/use-cases/reactivate-task.use-case';
import { DeleteTaskUseCase } from '../application/use-cases/delete-task.use-case';
import { CreateTaskDto } from '../application/dtos/create-task.dto';
import { UpdateTaskDto } from '../application/dtos/update-task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly getTodayTasks: GetTodayTasksUseCase,
    private readonly getTeamTasks: GetTeamTasksUseCase,
    private readonly completeTask: CompleteTaskUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly reactivateTask: ReactivateTaskUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
  ) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Create a new task' })
  create(
    @Body() dto: CreateTaskDto,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    if (req.user.role === UserRole.Seller) {
      if (!req.user.sellerId) throw new ForbiddenException();
      dto.sellerId = req.user.sellerId;
    }
    return this.createTask.execute(dto);
  }

  @Get('team')
  @Roles(UserRole.Admin, UserRole.Director)
  @ApiOperation({ summary: 'Get all team tasks (Admin/Director only)' })
  getTeam(@Query('date') date: string | undefined) {
    return this.getTeamTasks.execute({ date });
  }

  @Get('seller/:id/today')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get today tasks for a seller' })
  getToday(
    @Param('id') sellerId: string,
    @Query('date') date: string | undefined,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    if (req.user.role === UserRole.Seller && req.user.sellerId !== sellerId) {
      throw new ForbiddenException();
    }
    return this.getTodayTasks.execute({ sellerId, date });
  }

  @Patch(':id/complete')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Mark a task as completed' })
  complete(
    @Param('id') taskId: string,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    return this.completeTask.execute({
      taskId,
      callerRole: req.user.role,
      callerSellerId: req.user.sellerId,
    });
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    return this.updateTask.execute({
      taskId,
      callerRole: req.user.role,
      callerSellerId: req.user.sellerId,
      ...dto,
    });
  }

  @Patch(':id/reactivate')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Reactivate a completed task' })
  reactivate(
    @Param('id') taskId: string,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    return this.reactivateTask.execute({
      taskId,
      callerRole: req.user.role,
      callerSellerId: req.user.sellerId,
    });
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Delete a task' })
  delete(
    @Param('id') taskId: string,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    return this.deleteTask.execute({
      taskId,
      callerRole: req.user.role,
      callerSellerId: req.user.sellerId,
    });
  }
}
