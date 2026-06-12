import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LLM_PROVIDER,
  LlmProvider,
} from '../../domain/ports/llm-provider.port';
import { SuggestionRequestDto } from '../dtos/suggestion-request.dto';

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

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async execute(dto: SuggestionRequestDto) {
    const system =
      'Eres un coach de ventas B2B experto. Responde en español, ' +
      'con 2-3 tips accionables y breves (máx 25 palabras cada uno). ' +
      'Responde SOLO un array JSON de strings, sin markdown ni texto extra.';

    const user = [
      `Tipo de actividad: ${dto.type}`,
      dto.objective && `Objetivo: ${dto.objective}`,
      dto.client && `Cliente: ${dto.client}`,
      dto.dealStage && `Etapa del deal: ${dto.dealStage}`,
      dto.contactName && `Contacto: ${dto.contactName}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const raw = await this.llm.complete({ system, user, maxTokens: 300 });
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
}
