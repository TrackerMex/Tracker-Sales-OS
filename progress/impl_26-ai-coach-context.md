# Feature 26 — ai-coach-context

Enriquecer el prompt de `POST /api/coaching/suggestion` con contexto real. Mismo endpoint, mismo proveedor LLM, backend-only, retrocompatible, sin tablas nuevas.

## Archivos modificados

- `backend/src/modules/coaching/application/dtos/suggestion-request.dto.ts`
  - Dos campos opcionales nuevos al final: `clientId?: string` y `sellerId?: string` (`@IsOptional` + `@IsString`). Retrocompatibles.

- `backend/src/modules/coaching/presentation/coaching.controller.ts`
  - `getSuggestion` ahora recibe `@Request() req` y toma `sellerId` del JWT (`req.user.sellerId`) como fallback cuando el body no lo trae: `sellerId: dto.sellerId ?? req.user.sellerId ?? undefined`.
  - `Request` agregado al import de `@nestjs/common`.

- `backend/src/modules/coaching/application/use-cases/generate-suggestion.use-case.ts`
  - Inyecta 3 dependencias además de `LLM_PROVIDER`: `Repository<ActivityTypeormEntity>` (`@InjectRepository`), `IDealsRepository` (token `DEAL_REPOSITORY`) y `GetSettingsUseCase`.
  - Nuevo método privado `buildContext(dto)` best-effort: cada bloque va en su propio `try/catch`, si una consulta falla la sugerencia se genera igual con el contexto disponible (warn al logger).
  - `system` prompt ajustado para indicar al modelo que use el contexto y priorice reactivar deals estancados.
  - `maxTokens` subido de 300 a 400.
  - El bloque `try/catch` del `llm.complete` y los `FALLBACKS` quedan igual. Firma sigue recibiendo `SuggestionRequestDto`.

- `backend/src/modules/coaching/coaching.module.ts`
  - Importa `PipelineModule` (exporta `DEAL_REPOSITORY`) en `imports`. `ActivityTypeormEntity` ya estaba en `TypeOrmModule.forFeature`; `SettingsModule` ya estaba importado.

## Contexto anexado al prompt (bloque "Contexto adicional:")

a) **Últimas 3 actividades del cliente** (solo si `clientId`): líneas `- <type> (<result>): <summary[:80]>`. Filtra `deletedAt IS NULL`, orden `executedAt DESC`, `take 3`.

b) **Deal / días en etapa / estancamiento** (solo si `clientId && sellerId`): vía `dealRepo.findByClientIdAndSellerId`. Calcula `daysInStage` desde el último `stageHistory[].changedAt` (o `deal.createdAt` si no hay historial). Agrega `Días en la etapa actual (<stage>): N` y, si `daysInStage >= settings.stalledAmberDays` (default 7), una línea `ALERTA: ... estancado ...`.

c) **Calidad promedio del vendedor (30 días)** (solo si `sellerId`): `AVG(a.quality)` con `sellerId`, `executedAt >= hoy-30d`, `deletedAt IS NULL`. Si `> 0`, agrega `Calidad promedio del vendedor (últimos 30 días): N%`.

Si no hay `clientId`/`sellerId` (peticiones antiguas), `context` queda vacío y el prompt es idéntico al anterior → retrocompatible.

## Verificación

`cd backend && pnpm exec tsc --noEmit` → **exit 0**.
