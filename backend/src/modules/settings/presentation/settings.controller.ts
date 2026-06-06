import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  // TODO: implement in feature 14-settings
  @Get()
  getSettings() { throw new Error('Not implemented'); }

  @Patch()
  updateSettings(@Body() _dto: unknown) { throw new Error('Not implemented'); }
}
