import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { GetDashboardSummaryUseCase } from '../application/use-cases/get-dashboard-summary.use-case';
import { GetSellersScoreUseCase } from '../application/use-cases/get-sellers-score.use-case';
import { GetOverdueTasksUseCase } from '../application/use-cases/get-overdue-tasks.use-case';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardSummary: GetDashboardSummaryUseCase,
    private readonly getSellersScoreUseCase: GetSellersScoreUseCase,
    private readonly getOverdueTasksUseCase: GetOverdueTasksUseCase,
  ) {}

  @Get('summary')
  getSummary() {
    return this.getDashboardSummary.execute();
  }

  @Get('sellers-score')
  fetchSellersScore() {
    return this.getSellersScoreUseCase.execute();
  }

  @Get('overdue-tasks')
  fetchOverdueTasks() {
    return this.getOverdueTasksUseCase.execute();
  }

  @Get('mi-dia/seller/:id')
  getMiDia(@Param('id') _sellerId: string) {
    throw new Error('Not implemented — feature 10');
  }
}
