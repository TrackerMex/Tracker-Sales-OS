import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('coaching')
@Controller('coaching')
export class CoachingController {
  // TODO: implement in feature 11-coaching and 12-ai-coach
  @Get('seller/:id/daily')
  getDailyReport(@Param('id') _sellerId: string) { throw new Error('Not implemented'); }

  @Post('suggestion')
  getSuggestion(@Body() _dto: unknown) { throw new Error('Not implemented'); }
}
