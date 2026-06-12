# Feature 12 — IA Coach con OpenRouter (dev) / Anthropic (prod)

Prompt para Claude Code. Implementa `POST /api/coaching/suggestion` en el módulo `coaching` siguiendo Clean Architecture, con proveedor LLM intercambiable vía env.

---

## Contexto

- Repo: Tracker-Sales-OS, backend NestJS en `backend/`
- Módulo existente: `backend/src/modules/coaching/`
  - `presentation/coaching.controller.ts` → el endpoint lanza `Not implemented — feature 12`
  - `application/use-cases/get-coaching-daily.use-case.ts` (referencia de estilo)
- En dev se usará **OpenRouter con un modelo gratuito**; en prod, **Anthropic claude-haiku-4-5**. El use-case NO debe conocer al proveedor.

## Variables de entorno (.env.example)

```env
# AI Coach
LLM_PROVIDER=openrouter            # openrouter | anthropic
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5
LLM_TIMEOUT_MS=3000
```

> Nota: verificar en https://openrouter.ai/models los modelos `:free` vigentes (cambian seguido). Alternativas gratuitas típicas: `google/gemini-2.0-flash-exp:free`, `deepseek/deepseek-chat-v3:free`.

## Archivos a crear

### 1. Domain — puerto del proveedor
`backend/src/modules/coaching/domain/ports/llm-provider.port.ts`

```typescript
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmCompletionRequest {
  system: string;
  user: string;
  maxTokens: number;
}

export interface LlmProvider {
  complete(req: LlmCompletionRequest): Promise<string>;
}
```

### 2. DTO de entrada
`backend/src/modules/coaching/application/dtos/suggestion-request.dto.ts`

```typescript
import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestionRequestDto {
  @ApiProperty({ example: 'Llamada' })
  @IsString()
  type: string; // tipo de actividad: Chat/WA, Llamada, Videoconf, Visita, Propuesta, Seguimiento, Cierre

  @ApiPropertyOptional({ example: 'Agendar demo del producto' })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({ example: 'Transportes del Norte SA' })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiPropertyOptional({ example: 'Negociación' })
  @IsOptional()
  @IsIn(['Prospecto','Contactado','Interesado','Propuesta','Negociación','Cierre','Perdido'])
  dealStage?: string;

  @ApiPropertyOptional({ example: 'Ing. Martínez' })
  @IsOptional()
  @IsString()
  contactName?: string;
}
```

### 3. Use-case con fallback
`backend/src/modules/coaching/application/use-cases/generate-suggestion.use-case.ts`

```typescript
import { Inject, Injectable, Logger } from '@nestjs/common';
import { LLM_PROVIDER, LlmProvider } from '../../domain/ports/llm-provider.port';
import { SuggestionRequestDto } from '../dtos/suggestion-request.dto';

const FALLBACKS: Record<string, string[]> = {
  'Llamada': [
    'Prepara 3 preguntas de descubrimiento antes de marcar.',
    'Define el siguiente paso concreto antes de colgar.',
  ],
  'Propuesta': [
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
    ].filter(Boolean).join('\n');

    try {
      const raw = await this.llm.complete({ system, user, maxTokens: 300 });
      const clean = raw.replace(/```json|```/g, '').trim();
      const tips: string[] = JSON.parse(clean);
      if (!Array.isArray(tips) || tips.length === 0) throw new Error('Formato inválido');
      return { tips: tips.slice(0, 3), source: 'llm' };
    } catch (err) {
      this.logger.warn(`LLM falló, usando fallback: ${err.message}`);
      return { tips: FALLBACKS[dto.type] ?? FALLBACKS.default, source: 'fallback' };
    }
  }
}
```

### 4. Adaptador OpenRouter
`backend/src/modules/coaching/infrastructure/adapters/openrouter.adapter.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmCompletionRequest } from '../../domain/ports/llm-provider.port';

@Injectable()
export class OpenRouterAdapter implements LlmProvider {
  constructor(private readonly config: ConfigService) {}

  async complete(req: LlmCompletionRequest): Promise<string> {
    const timeout = Number(this.config.get('LLM_TIMEOUT_MS') ?? 3000);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.get('OPENROUTER_MODEL'),
        max_tokens: req.maxTokens,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
      }),
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
}
```

### 5. Adaptador Anthropic (prod)
`backend/src/modules/coaching/infrastructure/adapters/anthropic.adapter.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmCompletionRequest } from '../../domain/ports/llm-provider.port';

@Injectable()
export class AnthropicAdapter implements LlmProvider {
  constructor(private readonly config: ConfigService) {}

  async complete(req: LlmCompletionRequest): Promise<string> {
    const timeout = Number(this.config.get('LLM_TIMEOUT_MS') ?? 3000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.get('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.get('ANTHROPIC_MODEL') ?? 'claude-haiku-4-5',
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
      }),
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text ?? '';
  }
}
```

## Archivos a modificar

### 6. Controller
En `presentation/coaching.controller.ts`, reemplazar el método:

```typescript
@Post('suggestion')
getSuggestion(@Body() dto: SuggestionRequestDto) {
  return this.generateSuggestion.execute(dto);
}
```
(inyectar `GenerateSuggestionUseCase` en el constructor)

### 7. Módulo con factory por env
En `coaching.module.ts`, agregar providers:

```typescript
{
  provide: LLM_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    config.get('LLM_PROVIDER') === 'anthropic'
      ? new AnthropicAdapter(config)
      : new OpenRouterAdapter(config),
},
GenerateSuggestionUseCase,
```

### 8. Frontend
- En los formularios de **actividades** y **tareas**, agregar botón/sección "💡 Sugerencias IA" que haga `POST /api/coaching/suggestion` con los datos del form actual y muestre los tips (con estado loading y manejo silencioso de error → mostrar fallbacks que ya retorna el backend).

## Checkpoints a validar (CHECKPOINTS.md líneas 129-137)

- [ ] `POST /api/coaching/suggestion` retorna sugerencias (vía OpenRouter en dev)
- [ ] Prompt incluye: tipo actividad, objetivo, cliente, stage del deal
- [ ] Response < 3 segundos (timeout configurado en LLM_TIMEOUT_MS)
- [ ] Si la API falla, retorna sugerencias por defecto (`source: "fallback"`)
- [ ] Keys en .env (OPENROUTER_API_KEY en dev / ANTHROPIC_API_KEY en prod)
- [ ] Frontend muestra sugerencias en formularios de tarea/actividad
- [ ] Actualizar `feature_list.json`: feature 12 → `"status": "done"` con nota del provider switch
