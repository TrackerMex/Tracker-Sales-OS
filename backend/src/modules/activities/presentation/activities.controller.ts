import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  // TODO: implement in feature 05-activities
  @Post()
  create(@Body() _dto: unknown) { throw new Error('Not implemented'); }

  @Get('seller/:id/daily')
  getDailyPoints(@Param('id') _sellerId: string) { throw new Error('Not implemented'); }

  @Get('seller/:id')
  findBySeller(@Param('id') _sellerId: string) { throw new Error('Not implemented'); }
}
