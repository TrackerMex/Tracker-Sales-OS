import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  // TODO: implement in feature 04-clients
  @Get()
  findAll(@Query() _query: unknown) { throw new Error('Not implemented'); }

  @Post()
  create(@Body() _dto: unknown) { throw new Error('Not implemented'); }

  @Patch(':id')
  update(@Param('id') _id: string, @Body() _dto: unknown) { throw new Error('Not implemented'); }

  @Post(':id/contacts')
  addContact(@Param('id') _id: string, @Body() _dto: unknown) { throw new Error('Not implemented'); }
}
