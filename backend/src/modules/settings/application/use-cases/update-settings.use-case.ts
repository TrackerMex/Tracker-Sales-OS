import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingTypeormEntity } from '../../infrastructure/entities/setting.typeorm.entity';
import { AppSettings } from '../../domain/entities/setting.entity';
import { GetSettingsUseCase } from './get-settings.use-case';
import { UpdateSettingsDto } from '../dtos/update-settings.dto';

const SETTINGS_KEY = 'app_settings';

@Injectable()
export class UpdateSettingsUseCase {
  constructor(
    @InjectRepository(SettingTypeormEntity)
    private readonly repo: Repository<SettingTypeormEntity>,
    private readonly getSettings: GetSettingsUseCase,
  ) {}

  async execute(dto: UpdateSettingsDto): Promise<AppSettings> {
    const current = await this.getSettings.execute();
    const updated: AppSettings = { ...current, ...dto };
    await this.repo.upsert(
      { key: SETTINGS_KEY, value: updated as unknown as object },
      ['key'],
    );
    this.getSettings.invalidate();
    return this.getSettings.execute();
  }
}
