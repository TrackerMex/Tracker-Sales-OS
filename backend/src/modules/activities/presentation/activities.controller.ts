import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { CreateActivityUseCase } from '../application/use-cases/create-activity.use-case';
import { GetDailyActivitiesUseCase } from '../application/use-cases/get-daily-activities.use-case';
import { GetSellerActivitiesUseCase } from '../application/use-cases/get-seller-activities.use-case';
import { CreateActivityDto } from '../application/dtos/create-activity.dto';
import { GetActivitiesQueryDto } from '../application/dtos/get-activities-query.dto';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly createActivity: CreateActivityUseCase,
    private readonly getDailyActivities: GetDailyActivitiesUseCase,
    private readonly getSellerActivities: GetSellerActivitiesUseCase,
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
  getDailyPoints(@Param('id') sellerId: string, @Query() query: GetActivitiesQueryDto) {
    return this.getDailyActivities.execute({ sellerId, date: query.date });
  }

  @Get('seller/:id')
  @Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
  @ApiOperation({ summary: 'Get all activities for a seller with pagination' })
  findBySeller(@Param('id') sellerId: string, @Query() query: GetActivitiesQueryDto) {
    return this.getSellerActivities.execute({ sellerId, ...query });
  }
}
