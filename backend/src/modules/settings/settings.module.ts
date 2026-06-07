import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SettingTypeormEntity } from './infrastructure/entities/setting.typeorm.entity';
import { SettingsController } from './presentation/settings.controller';
import { GetSettingsUseCase } from './application/use-cases/get-settings.use-case';
import { UpdateSettingsUseCase } from './application/use-cases/update-settings.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([SettingTypeormEntity]), AuthModule],
  controllers: [SettingsController],
  providers: [GetSettingsUseCase, UpdateSettingsUseCase],
  exports: [GetSettingsUseCase],
})
export class SettingsModule {}
