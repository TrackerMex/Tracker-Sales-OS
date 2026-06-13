# Explore 25 — Pipeline (win/loss + lossReason)

## Entidad Deal
`backend/src/modules/pipeline/domain/entities/deal.entity.ts`
```ts
export interface StageHistoryEntry {
  stage: PipelineStage;
  changedAt: string;   // ISO
  changedBy: string;
}
export class DealEntity extends BaseEntity {
  clientId; clientName; sellerId; stage: PipelineStage;
  amount: number; probability: number; stageHistory: StageHistoryEntry[];
}
export const STAGE_PROBABILITY: Record<PipelineStage, number>;
export const ALLOWED_TRANSITIONS: Partial<Record<PipelineStage, PipelineStage[]>>;
```
- `stageHistory` inicia `[]`. **Solo registra transiciones, NO el stage inicial** (caveat conocido feature 18).
- TypeORM: `backend/src/modules/pipeline/infrastructure/entities/deal.typeorm.entity.ts`, columna `stage_history jsonb default []`.
- Transiciones son SECUENCIALES: cada stage solo → siguiente o → Perdido. (Permite reconstruir maxStage por índice canónico.)

## Enum PipelineStage
`backend/src/modules/clients/domain/entities/client.entity.ts`
```
Prospecto, Contactado, Interesado, Propuesta, Negociación (valor con acento), Cierre, Perdido
```

## Cambio de stage
`backend/src/modules/pipeline/application/use-cases/change-deal-stage.use-case.ts`
```ts
interface ChangeDealStageInput { id; newStage: PipelineStage; changedBy: string; }
// valida ALLOWED_TRANSITIONS, appendea historyEntry, set probability, update.
```
DTO body: `backend/src/modules/pipeline/application/dtos/change-stage.dto.ts` → `ChangeStageDtoBody { newStage @IsEnum; changedBy @IsString }`.
Controller `DealsController` (`backend/src/modules/pipeline/presentation/pipeline.controller.ts`): `@Patch('deals/:id/stage')` → `execute({ id, ...dto })` (lossReason fluiría solo si se añade al DTO). AuditInterceptor activo.

## Repo deals
Interface `backend/src/modules/pipeline/domain/repositories/deal.repository.interface.ts` — token `DEAL_REPOSITORY`. Métodos: findById, findAll, findBySellerId, findByStage, getWeightedForecast, **findStalledDeals(amberDays)** (raw SQL JSONB, patrón a replicar).
Impl `backend/src/modules/pipeline/infrastructure/repositories/deal.repository.impl.ts`. `toDomain` mapea amount a Number.

## Módulo
`backend/src/modules/pipeline/pipeline.module.ts` — `exports: [DEAL_REPOSITORY]` (reports puede inyectarlo importando PipelineModule).

## Frontend pipeline
- `domain/pipeline.types.ts`: `StageHistoryEntry`, `Deal`, `ChangeStageInput { newStage; changedBy }`.
- `infrastructure/pipeline.api.ts`: `changeStage(dealId, input)` → `PATCH /deals/:id/stage`.
- `application/hooks/useChangeStage.ts`: mutation, invalida `['pipeline']`.
- `presentation/pages/PipelinePage.tsx`: `handleChangeStage(dealId, newStage)` disparado por drag-drop → `mutate({ dealId, input: { newStage, changedBy: username } })`. Aquí va el modal de lossReason cuando newStage === "Perdido".
