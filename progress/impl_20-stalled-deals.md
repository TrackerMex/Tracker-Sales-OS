# Impl: Feature 20 — Detección de deals estancados

## Archivos modificados

### Backend
- `backend/src/modules/settings/domain/entities/setting.entity.ts` — Added `stalledAmberDays: number` (default 7) and `stalledRedDays: number` (default 14) to `AppSettings` and `DEFAULT_SETTINGS`
- `backend/src/modules/settings/application/dtos/update-settings.dto.ts` — Added optional fields `stalledAmberDays` and `stalledRedDays` with `@IsOptional @IsNumber @Min(1)`
- `backend/src/modules/pipeline/domain/repositories/deal.repository.interface.ts` — Added `findStalledDeals(amberDays: number): Promise<{ deal: DealEntity; daysStalled: number }[]>`
- `backend/src/modules/pipeline/infrastructure/repositories/deal.repository.impl.ts` — Implemented `findStalledDeals` via raw SQL query with JSONB extraction of last `stageHistory.changedAt`
- `backend/src/modules/dashboard/presentation/dashboard.controller.ts` — Added `GET /dashboard/stalled-deals` with `RolesGuard` + `@Roles(Admin, Director)`
- `backend/src/modules/dashboard/dashboard.module.ts` — Registered `GetStalledDealsUseCase`
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts` — Added `findStalledDeals: jest.fn()` to mock to satisfy TypeScript

### Backend (new files)
- `backend/src/modules/dashboard/application/dtos/stalled-deal.dto.ts`
- `backend/src/modules/dashboard/application/use-cases/get-stalled-deals.use-case.ts`

### Frontend
- `frontend/src/modules/settings/domain/settings.types.ts` — Added `stalledAmberDays` and `stalledRedDays` to `AppSettings` and `UpdateSettingsInput`
- `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx` — Added labels and form defaults for both new fields
- `frontend/src/modules/dashboard/domain/dashboard.types.ts` — Added `StalledDeal` interface
- `frontend/src/modules/dashboard/infrastructure/dashboard.api.ts` — Added `getStalledDeals()` calling `GET /dashboard/stalled-deals`
- `frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx` — Added "Deals en riesgo" section (Admin/Director only) with table
- `frontend/src/modules/pipeline/presentation/components/DealCard.tsx` — Added stall badge (amber/red) calculated from `stageHistory` using `useSettings()`

### Frontend (new files)
- `frontend/src/modules/dashboard/application/hooks/useStalledDeals.ts`

## Decisiones tomadas

- `sellerName` queda vacío (`''`) en `StalledDealDto` ya que `DealEntity` no tiene el campo y se evita un join adicional complejo
- `findStalledDeals` usa `manager.query()` con subquery SQL para filtrar por `days_stalled >= amberDays` antes de devolver resultados
- `DealCard` usa `useSettings()` directamente (TanStack Query lo sirve desde cache) en lugar de prop drilling por KanbanColumn
- Se excluyen stages `'Cierre'` y `'Perdido'` del cálculo de deals estancados

## Resultado de tsc

- Backend: PASS (sin errores)
- Frontend: PASS (sin errores)
