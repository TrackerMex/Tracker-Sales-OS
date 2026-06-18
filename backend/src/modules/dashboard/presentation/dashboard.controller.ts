import { Controller, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { GetDashboardSummaryUseCase } from '../application/use-cases/get-dashboard-summary.use-case';
import { GetSellersScoreUseCase } from '../application/use-cases/get-sellers-score.use-case';
import { GetOverdueTasksUseCase } from '../application/use-cases/get-overdue-tasks.use-case';
import { GetMiDiaUseCase } from '../application/use-cases/get-mi-dia.use-case';
import { GetActivityTrendUseCase, ActivityTrendItem } from '../application/use-cases/get-activity-trend.use-case';
import { GetStalledDealsUseCase } from '../application/use-cases/get-stalled-deals.use-case';
import { GetLeaderboardUseCase } from '../application/use-cases/get-leaderboard.use-case';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardSummary: GetDashboardSummaryUseCase,
    private readonly getSellersScoreUseCase: GetSellersScoreUseCase,
    private readonly getOverdueTasksUseCase: GetOverdueTasksUseCase,
    private readonly getMiDiaUseCase: GetMiDiaUseCase,
    private readonly getActivityTrendUseCase: GetActivityTrendUseCase,
    private readonly getStalledDealsUseCase: GetStalledDealsUseCase,
    private readonly getLeaderboardUseCase: GetLeaderboardUseCase,
  ) {}

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Director)
  getSummary() {
    return this.getDashboardSummary.execute();
  }

  @Get('sellers-score')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Director)
  fetchSellersScore() {
    return this.getSellersScoreUseCase.execute();
  }

  @Get('overdue-tasks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Director)
  fetchOverdueTasks() {
    return this.getOverdueTasksUseCase.execute();
  }

  @Get('activity-trend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Director)
  getActivityTrend(): Promise<ActivityTrendItem[]> {
    return this.getActivityTrendUseCase.execute();
  }

  @Get('mi-dia/seller/:id')
  getMiDia(
    @Param('id') sellerId: string,
    @Request() req: { user: { role: string; sellerId: string | null } },
  ) {
    if (req.user.role === UserRole.Seller && req.user.sellerId !== sellerId) {
      throw new ForbiddenException();
    }
    return this.getMiDiaUseCase.execute(sellerId);
  }

  @Get('stalled-deals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Director)
  getStalledDeals() {
    return this.getStalledDealsUseCase.execute();
  }

  @Get('leaderboard')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Director)
  getLeaderboard() {
    return this.getLeaderboardUseCase.execute();
  }
}
