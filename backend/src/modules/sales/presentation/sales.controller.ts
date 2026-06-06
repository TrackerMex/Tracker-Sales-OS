import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  // TODO: implement in feature 08-sales
  @Post()
  create(@Body() _dto: unknown) { throw new Error('Not implemented'); }

  @Get()
  findAll(@Query() _query: unknown) { throw new Error('Not implemented'); }
}
