import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  LLM_PROVIDER,
  LlmProvider,
} from '../../domain/ports/llm-provider.port';
import { SuggestionRequestDto } from '../dtos/suggestion-request.dto';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import {
  DEAL_REPOSITORY,
  IDealsRepository,
} from '../../../pipeline/domain/repositories/deal.repository.interface';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';

const FALLBACKS: Record<string, string[]> = {
  Llamada: [
    'Prepara 3 preguntas de descubrimiento antes de marcar.',
    'Define el siguiente paso concreto antes de colgar.',
  ],
  Propuesta: [
    'Personaliza la propuesta con los dolores detectados en actividades previas.',
    'Incluye fecha de vigencia para generar urgencia legítima.',
  ],
  default: [
    'Registra el resumen y el acuerdo inmediatamente para no perder calidad.',
    'Agenda el siguiente paso antes de cerrar la actividad.',
  ],
};

@Injectable()
export class GenerateSuggestionUseCase {
  private readonly logger = new Logger(GenerateSuggestionUseCase.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    @InjectRepository(ActivityTypeormEntity)
    private readonly activityRepo: Repository<ActivityTypeormEntity>,
    @Inject(DEAL_REPOSITORY) private readonly dealRepo: IDealsRepository,
    private readonly getSettings: GetSettingsUseCase,
  ) {}

  async execute(dto: SuggestionRequestDto) {
    const system =
      'Eres un coach de ventas B2B experto. Responde en español, ' +
      'con 2-3 tips accionables y breves (máx 25 palabras cada uno). ' +
      'Usa el contexto adicional (actividades recientes, días en etapa, ' +
      'estancamiento, calidad del vendedor) para personalizar los tips y, ' +
      'si el deal está estancado, prioriza acciones para reactivarlo. ' +
      'Responde SOLO un array JSON de strings, sin markdown ni texto extra.';

    const context = await this.buildContext(dto);

    const baseLines = [
      `Tipo de actividad: ${dto.type}`,
      dto.objective && `Objetivo: ${dto.objective}`,
      dto.client && `Cliente: ${dto.client}`,
      dto.dealStage && `Etapa del deal: ${dto.dealStage}`,
      dto.contactName && `Contacto: ${dto.contactName}`,
    ].filter(Boolean);

    const user = [
      ...baseLines,
      ...(context.length ? ['', 'Contexto adicional:', ...context] : []),
    ].join('\n');

    try {
      const raw = await this.llm.complete({ system, user, maxTokens: 400 });
      const clean = raw.replace(/```json|```/g, '').trim();
      const tips: string[] = JSON.parse(clean);
      if (!Array.isArray(tips) || tips.length === 0)
        throw new Error('Formato inválido');
      return { tips: tips.slice(0, 3), source: 'llm' };
    } catch (err) {
      this.logger.warn(`LLM falló, usando fallback: ${(err as Error).message}`);
      return {
        tips: FALLBACKS[dto.type] ?? FALLBACKS['default'],
        source: 'fallback',
      };
    }
  }

  private async buildContext(dto: SuggestionRequestDto): Promise<string[]> {
    const context: string[] = [];

    // a) Últimas 3 actividades del cliente
    if (dto.clientId) {
      try {
        const recent = await this.activityRepo.find({
          where: { clientId: dto.clientId, deletedAt: IsNull() },
          order: { executedAt: 'DESC' },
          take: 3,
        });
        if (recent.length > 0) {
          context.push('Últimas actividades con el cliente:');
          for (const a of recent) {
            context.push(
              `- ${a.type} (${a.result}): ${(a.summary ?? '').slice(0, 80)}`,
            );
          }
        }
      } catch (err) {
        this.logger.warn(
          `No se pudo cargar actividades recientes: ${(err as Error).message}`,
        );
      }
    }

    // b) Deal del cliente / días en etapa / estancamiento
    if (dto.clientId && dto.sellerId) {
      try {
        const deal = await this.dealRepo.findByClientIdAndSellerId(
          dto.clientId,
          dto.sellerId,
        );
        if (deal) {
          const history = deal.stageHistory ?? [];
          const lastChange =
            history.length > 0
              ? new Date(history[history.length - 1].changedAt)
              : deal.createdAt;
          const daysInStage = Math.floor(
            (Date.now() - lastChange.getTime()) / 86400000,
          );
          context.push(`Días en la etapa actual (${deal.stage}): ${daysInStage}`);

          const settings = await this.getSettings.execute();
          const amber = settings.stalledAmberDays ?? 7;
          if (daysInStage >= amber) {
            context.push(
              `ALERTA: este deal está estancado (${daysInStage} días sin avanzar de etapa). Prioriza desbloquearlo.`,
            );
          }
        }
      } catch (err) {
        this.logger.warn(
          `No se pudo cargar el deal: ${(err as Error).message}`,
        );
      }
    }

    // c) Calidad promedio del vendedor (últimos 30 días)
    if (dto.sellerId) {
      try {
        const since = new Date(Date.now() - 30 * 86400000);
        const raw = await this.activityRepo
          .createQueryBuilder('a')
          .select('AVG(a.quality)', 'avgQ')
          .where('a.sellerId = :sellerId', { sellerId: dto.sellerId })
          .andWhere('a.executedAt >= :since', { since })
          .andWhere('a.deletedAt IS NULL')
          .getRawOne<{ avgQ: string | null }>();
        const avgQ = Math.round(Number(raw?.avgQ ?? 0));
        if (avgQ > 0)
          context.push(
            `Calidad promedio del vendedor (últimos 30 días): ${avgQ}%`,
          );
      } catch (err) {
        this.logger.warn(
          `No se pudo cargar calidad del vendedor: ${(err as Error).message}`,
        );
      }
    }

    return context;
  }
}
