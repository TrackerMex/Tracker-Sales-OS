import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { GetCoachingDailyUseCase } from '../application/use-cases/get-coaching-daily.use-case';

@ApiTags('coaching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coaching')
export class CoachingController {
  constructor(private readonly getCoachingDaily: GetCoachingDailyUseCase) {}

  @Get('seller/:id/daily')
  getDailyReport(@Param('id') sellerId: string) {
    return this.getCoachingDaily.execute(sellerId);
  }

  @Post('suggestion')
  getSuggestion(@Body() _dto: unknown) {
    throw new Error('Not implemented — feature 12');
  }
}
