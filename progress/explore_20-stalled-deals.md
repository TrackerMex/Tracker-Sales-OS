# Explore: Feature 20 — Detección de deals estancados

## stage_history JSONB structure

```typescript
interface StageHistoryEntry {
  stage: PipelineStage;   // e.g. 'Contactado'
  changedAt: string;      // ISO 8601 timestamp
  changedBy: string;      // username
}
// Stored as JSONB array in deals.stage_history
// Last entry = most recent stage change
```

## Settings — campos actuales (domain + DTO)

```typescript
// domain/entities/setting.entity.ts
interface AppSettings {
  dailyMinPoints: number;        // default 30
  dailyCallsGoal: number;        // default 10
  monthlyAmountGoal: number;     // default 600000
  monthlyUnitGoal: number;       // default 150
  sellerMonthlyAmountGoal: number; // default 150000
}
// DB: table 'settings', key='app_settings', value=JSONB blob
```

**Agregar**:
- `stalledAmberDays: number` (default 7)
- `stalledRedDays: number` (default 14)

## IDealsRepository (actual)

```typescript
// backend/src/modules/pipeline/domain/repositories/deals.repository.interface.ts
interface IDealsRepository extends IRepository<DealEntity> {
  findBySellerId(sellerId: string): Promise<DealEntity[]>;
  findByStage(stage: PipelineStage): Promise<DealEntity[]>;
  findByClientIdAndSellerId(...): Promise<DealEntity | null>;
  findDetailedBySellerId(sellerId: string): Promise<{...}[]>;
  getWeightedForecast(): Promise<number>;
}
```

**Agregar**:
```typescript
findStalledDeals(amberDays: number): Promise<{ deal: DealEntity; daysStalled: number }[]>;
```

## Dashboard — endpoints actuales

```
GET /api/dashboard/summary       → DashboardSummaryDto (includes pipelineForecast)
GET /api/dashboard/sellers-score → SellerScoreDto[]
GET /api/dashboard/overdue-tasks → OverdueTaskDto[]
GET /api/dashboard/activity-trend → ActivityTrendItem[]
GET /api/dashboard/mi-dia/seller/:id → MiDiaDto
```

**Agregar**:
```
GET /api/dashboard/stalled-deals → StalledDealDto[] (Admin + Director)
```

## DashboardSummaryDto (para referencia)

```typescript
{ month, totalSalesAmount, totalUnits, totalSalesCount, totalPoints, avgQuality, pipelineForecast }
```

## Frontend pipeline — DealCard

- Path: `frontend/src/modules/pipeline/presentation/components/DealCard.tsx`
- Props actuales incluyen el objeto `Deal` completo con `stageHistory: StageHistoryEntry[]`
- `daysStalled` puede calcularse en frontend: `now - last stageHistory.changedAt` (o `createdAt` si stageHistory vacío)

## Frontend pipeline — PipelinePage

- Path: `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`
- Ya fetcha settings (para mostrar forecast vs monthlyAmountGoal). Puede pasar `stalledAmberDays` y `stalledRedDays` a DealCard.

## Frontend settings types

```typescript
// frontend/src/modules/settings/domain/settings.types.ts
interface AppSettings {
  dailyMinPoints: number;
  dailyCallsGoal: number;
  monthlyAmountGoal: number;
  monthlyUnitGoal: number;
  sellerMonthlyAmountGoal: number;
}
```

**Agregar** `stalledAmberDays` y `stalledRedDays` en AppSettings y UpdateSettingsInput.

## Pipeline module — PipelineModule providers

- `backend/src/modules/pipeline/pipeline.module.ts`
- Exporta `DEALS_REPOSITORY` token para que otros módulos puedan usarlo.

## Dashboard module injection

- Dashboard ya importa `PipelineModule` (para `getWeightedForecast` en summary). El `DashboardModule` ya tiene `DEALS_REPOSITORY` disponible vía imports.

## Rutas de archivos clave

```
backend/src/modules/settings/domain/entities/setting.entity.ts
backend/src/modules/settings/application/dtos/update-settings.dto.ts
backend/src/modules/pipeline/domain/repositories/deals.repository.interface.ts
backend/src/modules/pipeline/infrastructure/repositories/deals.repository.impl.ts
backend/src/modules/dashboard/application/use-cases/  (directorio)
backend/src/modules/dashboard/presentation/dashboard.controller.ts
backend/src/modules/dashboard/dashboard.module.ts

frontend/src/modules/settings/domain/settings.types.ts
frontend/src/modules/settings/presentation/pages/SettingsPage.tsx
frontend/src/modules/pipeline/domain/pipeline.types.ts
frontend/src/modules/pipeline/presentation/components/DealCard.tsx
frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx
frontend/src/modules/dashboard/domain/dashboard.types.ts
frontend/src/modules/dashboard/infrastructure/dashboard.api.ts
frontend/src/modules/dashboard/application/hooks/useDashboard.ts
frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx
```
