import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { ActivityTypeormEntity } from '../activities/infrastructure/entities/activity.typeorm.entity';
import { TaskTypeormEntity } from '../tasks/infrastructure/entities/task.typeorm.entity';
import { SellerTypeormEntity } from '../sellers/infrastructure/entities/seller.typeorm.entity';
import { CoachingController } from './presentation/coaching.controller';
import { GetCoachingDailyUseCase } from './application/use-cases/get-coaching-daily.use-case';
import { GenerateSuggestionUseCase } from './application/use-cases/generate-suggestion.use-case';
import { LLM_PROVIDER } from './domain/ports/llm-provider.port';
import { OpenRouterAdapter } from './infrastructure/adapters/openrouter.adapter';
import { AnthropicAdapter } from './infrastructure/adapters/anthropic.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityTypeormEntity,
      TaskTypeormEntity,
      SellerTypeormEntity,
    ]),
    ConfigModule,
    AuthModule,
    SettingsModule,
  ],
  controllers: [CoachingController],
  providers: [
    GetCoachingDailyUseCase,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get('LLM_PROVIDER') === 'anthropic'
          ? new AnthropicAdapter(config)
          : new OpenRouterAdapter(config),
    },
    GenerateSuggestionUseCase,
  ],
})
export class CoachingModule {}
