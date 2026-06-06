import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  // TODO: implement in feature 03-users-sellers
  @Get()
  findAll() { throw new Error('Not implemented'); }

  @Post()
  create(@Body() _dto: unknown) { throw new Error('Not implemented'); }

  @Patch(':id/deactivate')
  deactivate(@Param('id') _id: string) { throw new Error('Not implemented'); }
}
