import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  // TODO: implement in feature 07-pipeline
  @Get('seller/:id')
  findBySeller(@Param('id') _sellerId: string) { throw new Error('Not implemented'); }
}

@ApiTags('pipeline')
@Controller('deals')
export class DealsController {
  @Patch(':id/stage')
  changeStage(@Param('id') _id: string, @Body() _dto: unknown) { throw new Error('Not implemented'); }
}
