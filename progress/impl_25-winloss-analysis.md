# Impl 25 — Análisis win/loss y conversión por etapa (+ lossReason)

## Archivos tocados

### Backend
- `backend/src/modules/pipeline/domain/entities/deal.entity.ts`
  - Nuevo `export type LossReason = 'precio' | 'competencia' | 'sin_respuesta' | 'timing' | 'otro';`
  - `StageHistoryEntry` extendido con `lossReason?: LossReason;`
- `backend/src/modules/pipeline/application/dtos/change-stage.dto.ts`
  - Campo opcional `lossReason?: LossReason` con `@ApiPropertyOptional`, `@IsOptional`, `@IsIn([...])`.
- `backend/src/modules/pipeline/application/use-cases/change-deal-stage.use-case.ts`
  - `ChangeDealStageInput` += `lossReason?: LossReason`.
  - `historyEntry` incluye `lossReason` SOLO cuando `newStage === Perdido && input.lossReason`. Opcional, no lanza error si falta.
  - El controller (`DealsController.changeStage`) ya hace `execute({ id, ...dto })`, así que `lossReason` fluye solo. No hubo que mapear nada a mano.
- `backend/src/modules/pipeline/domain/repositories/deal.repository.interface.ts`
  - Nueva firma `findAllForAnalysis(): Promise<DealEntity[]>;`
- `backend/src/modules/pipeline/infrastructure/repositories/deal.repository.impl.ts`
  - `findAllForAnalysis()` = `this.repo.find({ order: { createdAt: 'DESC' } })` mapeado con `toDomain` (TypeORM excluye soft-deleted por default; sin filtro de seller; incluye stageHistory).
- NUEVO `backend/src/modules/reports/application/dtos/win-loss.dto.ts`
  - Interfaces `FunnelStageDto`, `LossByOriginDto`, `LossReasonDto` + clase `WinLossReportDto`.
- NUEVO `backend/src/modules/reports/application/use-cases/get-win-loss.use-case.ts`
  - `@Injectable`, implementa `IUseCase<void, WinLossReportDto>`, inyecta `DEAL_REPOSITORY`.
- `backend/src/modules/reports/presentation/reports.controller.ts`
  - `@Get('win-loss')` con `@Roles(Admin, Director)`, inyecta `GetWinLossUseCase`.
- `backend/src/modules/reports/reports.module.ts`
  - `imports` += `PipelineModule` (resuelve `DEAL_REPOSITORY`); `providers` += `GetWinLossUseCase`.
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts`
  - Solo el mock de `IDealsRepository`: añadido `findAllForAnalysis: jest.fn()` para compilar (sin tocar lógica de tests).

### Frontend
- `frontend/src/modules/pipeline/domain/pipeline.types.ts`
  - `LossReason`, `StageHistoryEntry.lossReason?`, `ChangeStageInput.lossReason?`.
- `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`
  - `handleChangeStage`: si `newStage === "Perdido"` abre `lossModal`; otros stages mutan directo.
  - Nuevo modal "Motivo de pérdida" con `<select>` (precio/competencia/sin_respuesta/timing/otro, labels ES) reusando `.modal-blur/.card/.input/.slabel/.btn-ghost/.btn-primary`. Motivo opcional: se puede confirmar sin elegir.
- `frontend/src/modules/reports/domain/reports.types.ts`
  - `FunnelStage`, `LossByOrigin`, `LossReasonRow`, `WinLossReport`.
- `frontend/src/modules/reports/infrastructure/reports.api.ts`
  - `getWinLoss()` → `GET /reports/win-loss`.
- NUEVO `frontend/src/modules/reports/application/hooks/useWinLoss.ts`
  - `useQuery` con queryKey `['reports','win-loss']`.
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`
  - Componente `WinLossSection` (KPI win rate/ganados/perdidos/abiertos, tabla embudo, tabla perdidos por origen, tabla motivos). Insertado ANTES del bloque "Análisis Ejecutivo IA". Maneja loading y empty (`totalDeals === 0`).

## Firmas nuevas
- Dominio backend: `type LossReason`, `StageHistoryEntry.lossReason?`, `IDealsRepository.findAllForAnalysis()`.
- Use case: `GetWinLossUseCase.execute(): Promise<WinLossReportDto>`.
- Endpoint: `GET /api/reports/win-loss` (Admin/Director).

## Lógica del cómputo win/loss
- ORDER canónico (sin Perdido): `[Prospecto, Contactado, Interesado, Propuesta, Negociación, Cierre]`. `idx(stage) = ORDER.indexOf(stage)`.
- won = stage actual === Cierre; lost = stage actual === Perdido; open = resto. winRate = `won/(won+lost)*100` (0 si denom 0).
- **maxStage por deal**: si stage !== Perdido → stage actual; si Perdido → `originStage` (último stage de stageHistory que NO sea Perdido; Prospecto si no hay).
- **funnel.reached[i]** = # deals con `idx(maxStage) >= i` (transiciones secuenciales ⇒ alcanzar una etapa implica las previas).
- **conversionFromPrevious[i]** = `i===0 ? 0 : round(reached[i]/reached[i-1]*100)` (guard /0 → 0).
- **avgDaysInStage**: por cada par consecutivo de stageHistory (k, k+1), stage = `hist[k].stage`, días = `(changedAt[k+1]-changedAt[k])/86400000`; se acumula sum/count por stage; avg = `round1(sum/count)` (0 si count 0).
- **lossesByOrigin**: agrupa deals Perdido por `originStage`; percentage = `count/lost*100`; ordenado desc por count.
- **lossReasons**: para cada Perdido lee `lossReason` de la ÚLTIMA entrada de stageHistory (la del Perdido); falta → 'sin especificar'; counts agrupados, ordenado desc.
- Redondeo: porcentajes y reached a enteros; avgDaysInStage a 1 decimal.

## Limitaciones documentadas
- **avgDaysInStage**: solo cubre el dwell entre transiciones registradas en stageHistory. Se OMITE el dwell del stage inicial (creado sin entry, caveat feature 18) y el del stage actual en curso (aún sin transición de salida). Por tanto los promedios reflejan únicamente intervalos ya cerrados entre stages consecutivos.
- **origin de Perdido**: si el stageHistory del deal Perdido no tiene una entrada previa no-Perdido (solo Perdido o vacío), el origin cae por defecto a Prospecto.

## Resultados tsc
- Backend `npx tsc --noEmit`: exit 0
- Frontend `npx tsc --noEmit`: exit 0
