import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  // TODO: implement in features 09-dashboard and 10-mi-dia
  @Get('summary')
  getSummary() { throw new Error('Not implemented'); }

  @Get('sellers-score')
  getSellersScore() { throw new Error('Not implemented'); }

  @Get('overdue-tasks')
  getOverdueTasks() { throw new Error('Not implemented'); }

  @Get('mi-dia/seller/:id')
  getMiDia(@Param('id') _sellerId: string) { throw new Error('Not implemented'); }
}
