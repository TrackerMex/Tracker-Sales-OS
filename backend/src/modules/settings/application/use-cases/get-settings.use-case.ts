import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingTypeormEntity } from '../../infrastructure/entities/setting.typeorm.entity';
import { AppSettings, DEFAULT_SETTINGS } from '../../domain/entities/setting.entity';

const SETTINGS_KEY = 'app_settings';

@Injectable()
export class GetSettingsUseCase implements OnModuleInit {
  private cache: AppSettings | null = null;

  constructor(
    @InjectRepository(SettingTypeormEntity)
    private readonly repo: Repository<SettingTypeormEntity>,
  ) {}

  async onModuleInit() {
    await this.execute();
  }

  async execute(): Promise<AppSettings> {
    if (this.cache) return this.cache;

    const row = await this.repo.findOne({ where: { key: SETTINGS_KEY } });
    if (!row) {
      await this.repo.save({ key: SETTINGS_KEY, value: DEFAULT_SETTINGS as unknown as object });
      this.cache = { ...DEFAULT_SETTINGS };
    } else {
      this.cache = row.value as unknown as AppSettings;
    }
    return this.cache;
  }

  invalidate() {
    this.cache = null;
  }
}
