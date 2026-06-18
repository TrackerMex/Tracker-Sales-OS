import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Inject, Request, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { CreateActivityUseCase } from '../application/use-cases/create-activity.use-case';
import { GetDailyActivitiesUseCase } from '../application/use-cases/get-daily-activities.use-case';
import { GetSellerActivitiesUseCase } from '../application/use-cases/get-seller-activities.use-case';
import { UpdateActivityStatusUseCase } from '../application/use-cases/update-activity-status.use-case';
import { CreateActivityDto } from '../application/dtos/create-activity.dto';
import { GetActivitiesQueryDto } from '../application/dtos/get-activities-query.dto';
import { ActivityDto } from '../application/dtos/activity.dto';
import { ACTIVITY_REPOSITORY, IActivityRepository } from '../domain/repositories/activity.repository.interface';

class UpdateActivityStatusDto {
  @IsString() @IsIn(['En curso', 'Completada', 'Cancelada']) newStatus: string;
  @IsOptional() @IsString() comment?: string;
}

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly createActivity: CreateActivityUseCase,
    private readonly getDailyActivities: GetDailyActivitiesUseCase,
    private readonly getSellerActivities: GetSellerActivitiesUseCase,
    private readonly updateActivityStatus: UpdateActivityStatusUseCase,
    @Inject(ACTIVITY_REPOSITORY) private readonly activityRepo: IActivityRepository,
  ) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Register a new activity' })
  create(@Body() dto: CreateActivityDto) {
    return this.createActivity.execute(dto);
  }

  @Get('seller/:id/daily')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get daily activities and points for a seller' })
  getDailyPoints(
    @Param('id') sellerId: string,
    @Query() query: GetActivitiesQueryDto,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    if (req.user.role === UserRole.Seller && req.user.sellerId !== sellerId) {
      throw new ForbiddenException();
    }
    return this.getDailyActivities.execute({ sellerId, date: query.date });
  }

  @Get('seller/:id')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get all activities for a seller with pagination' })
  findBySeller(
    @Param('id') sellerId: string,
    @Query() query: GetActivitiesQueryDto,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    if (req.user.role === UserRole.Seller && req.user.sellerId !== sellerId) {
      throw new ForbiddenException();
    }
    return this.getSellerActivities.execute({ sellerId, ...query });
  }

  @Get('client/:clientId')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get all activities for a client' })
  findByClient(@Param('clientId') clientId: string): Promise<ActivityDto[]> {
    return this.activityRepo
      .findByClientId(clientId)
      .then((entities) => entities.map((e) => ActivityDto.fromEntity(e)));
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get a single activity by id' })
  async findById(@Param('id') id: string): Promise<ActivityDto> {
    const activity = await this.activityRepo.findById(id);
    if (!activity) throw new NotFoundException('Activity not found');
    return ActivityDto.fromEntity(activity);
  }

  @Patch(':id/status')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Update activity status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateActivityStatusDto,
    @Request() req: { user: { id: string; username: string } },
  ) {
    return this.updateActivityStatus.execute({
      id,
      newStatus: dto.newStatus,
      changedBy: req.user.username,
      comment: dto.comment,
    });
  }
}
