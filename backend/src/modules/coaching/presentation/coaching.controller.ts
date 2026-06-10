import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { GetCoachingDailyUseCase } from '../application/use-cases/get-coaching-daily.use-case';
import { GenerateSuggestionUseCase } from '../application/use-cases/generate-suggestion.use-case';
import { SuggestionRequestDto } from '../application/dtos/suggestion-request.dto';

@ApiTags('coaching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coaching')
export class CoachingController {
  constructor(
    private readonly getCoachingDaily: GetCoachingDailyUseCase,
    private readonly generateSuggestion: GenerateSuggestionUseCase,
  ) {}

  @Get('seller/:id/daily')
  getDailyReport(@Param('id') sellerId: string) {
    return this.getCoachingDaily.execute(sellerId);
  }

  @Post('suggestion')
  getSuggestion(@Body() dto: SuggestionRequestDto) {
    return this.generateSuggestion.execute(dto);
  }
}
