import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { GetSettingsUseCase } from '../application/use-cases/get-settings.use-case';
import { UpdateSettingsUseCase } from '../application/use-cases/update-settings.use-case';
import { UpdateSettingsDto } from '../application/dtos/update-settings.dto';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(
    private readonly getSettings: GetSettingsUseCase,
    private readonly updateSettings: UpdateSettingsUseCase,
  ) {}

  @Get()
  @Roles(UserRole.Admin, UserRole.Director)
  get() {
    return this.getSettings.execute();
  }

  @Patch()
  @Roles(UserRole.Admin)
  update(@Body() dto: UpdateSettingsDto) {
    return this.updateSettings.execute(dto);
  }
}
