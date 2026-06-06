import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  // TODO: implement in feature 13-reports
  @Get('monthly')
  getMonthlyReport(@Query('month') _month: string) { throw new Error('Not implemented'); }

  @Get('seller/:id')
  getSellerReport(@Query('month') _month: string) { throw new Error('Not implemented'); }
}
