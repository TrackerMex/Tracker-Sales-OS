import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  // TODO: implement in feature 06-tasks
  @Post()
  create(@Body() _dto: unknown) { throw new Error('Not implemented'); }

  @Get('seller/:id/today')
  findToday(@Param('id') _sellerId: string) { throw new Error('Not implemented'); }

  @Patch(':id/complete')
  complete(@Param('id') _id: string) { throw new Error('Not implemented'); }
}
