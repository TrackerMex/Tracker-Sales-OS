import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { GetMonthlyReportUseCase } from '../application/use-cases/get-monthly-report.use-case';
import { GetWinLossUseCase } from '../application/use-cases/get-win-loss.use-case';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly getMonthlyReport: GetMonthlyReportUseCase,
    private readonly getWinLossUseCase: GetWinLossUseCase,
  ) {}

  @Get('monthly')
  @Roles(UserRole.Admin, UserRole.Director)
  getMonthly(@Query('month') month: string) {
    const m = month || new Date().toISOString().slice(0, 7);
    return this.getMonthlyReport.execute({ month: m });
  }

  @Get('win-loss')
  @Roles(UserRole.Admin, UserRole.Director)
  @ApiOperation({ summary: 'Win/loss and stage conversion analysis' })
  getWinLoss() {
    return this.getWinLossUseCase.execute();
  }
}
