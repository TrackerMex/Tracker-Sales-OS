# Explore 21-leaderboard

Consolidado de 2 subagentes Explore (backend + frontend dashboard). Read-only.

## Backend — módulo dashboard

Raíz: `backend/src/modules/dashboard/`

- `application/use-cases/`: get-sellers-score, get-dashboard-summary, get-overdue-tasks, get-mi-dia, get-activity-trend, get-stalled-deals
- `application/dtos/`: seller-score, stalled-deal, dashboard-summary, mi-dia, overdue-task
- `presentation/dashboard.controller.ts`: `@Controller('dashboard')` + `@UseGuards(JwtAuthGuard)`
- `dashboard.module.ts`: importa AuthModule, SettingsModule, PipelineModule; TypeOrmModule.forFeature([ActivityTypeormEntity, TaskTypeormEntity, SaleTypeormEntity, SellerTypeormEntity, ClientTypeormEntity])

### Cálculo de puntos por vendedor (referencia)
`get-sellers-score.use-case.ts` — `implements IUseCase<void, SellerScoreDto[]>`.
- TASK_POINTS en `activities/domain/entities/activity.entity.ts`.
- monthlyPoints = SUM(activity.points) con executed_at en [mes inicio, mes siguiente). Rango: `new Date(y, m, 1)` .. `new Date(y, m+1, 1)`.
- Lee sellers activos del repo de sellers; map id→name.

### Settings (dailyMinPoints)
`settings/application/use-cases/get-settings.use-case.ts` — `GetSettingsUseCase`, cache en memoria, `execute(): Promise<AppSettings>`. Exportado por SettingsModule.
`AppSettings.dailyMinPoints` default 30 (`settings/domain/entities/setting.entity.ts`).

### Repo de activities
`activities/domain/repositories/activity.repository.interface.ts`:
```ts
export const ACTIVITY_REPOSITORY = 'ACTIVITY_REPOSITORY';
export interface IActivityRepository extends IRepository<ActivityEntity> {
  findDailyBySeller(sellerId: string, date: Date): Promise<ActivityEntity[]>;
  sumDailyPoints(sellerId: string, date: Date): Promise<number>;
  findRecentBySeller(sellerId: string, limit: number): Promise<ActivityEntity[]>;
}
```
Impl: `activities/infrastructure/repositories/activity.repository.impl.ts`. Entity TypeORM `activities` con `seller_id`, `points` int, `executed_at` timestamptz, `deleted_at`.
ActivitiesModule exporta `ACTIVITY_REPOSITORY`.

**Gap**: no hay método para sumar puntos por día agrupado por seller sobre rango. Hay que agregarlo (evitar N+1).

### Roles / guards (patrón stalled-deals)
```ts
@Get('stalled-deals')
@UseGuards(RolesGuard)
@Roles(UserRole.Admin, UserRole.Director)
```
- RolesGuard: `auth/infrastructure/guards/roles.guard.ts`
- `@Roles`: `auth/presentation/decorators/roles.decorator.ts`
- UserRole enum: `auth/domain/entities/user.entity.ts` (Admin/Director/Seller)

### DTO patrón
`stalled-deal.dto.ts`: clase plana con campos primitivos. Endpoints retornan arrays planos.

### Sellers
`sellers/infrastructure/entities/seller.typeorm.entity.ts`: `id`, `name`, `active`, `deleted_at`. Filtrar `active: true, deletedAt: IsNull()`.

### Core
`core/domain/use-case.interface.ts`: `IUseCase<TInput,TOutput>`.

## Frontend — módulo dashboard

Raíz: `frontend/src/modules/dashboard/`

- `application/hooks/`: useActivityTrend, useDashboardSummary, useOverdueTasks, useSellersSemaphore, useStalledDeals
- `domain/dashboard.types.ts`
- `infrastructure/dashboard.api.ts`
- `presentation/components/`: AlertsPanel, KPICard, KPIStrip, OverdueTasksList, SellerSemaphoreTable
- `presentation/pages/DashboardPage.tsx`

### DashboardPage secciones (orden)
título → error → KPIStrip → grid(Activity chart | AlertsPanel) → SellerSemaphoreTable → Stalled deals (solo Admin/Director, patrón `isAdminOrDirector`). Insertar Leaderboard entre SellerSemaphoreTable y Stalled deals.

Rol: `const currentUser = useAppStore((s) => s.currentUser)` / `isAdminOrDirector = role === Admin || role === Director`. UserRole en `core/domain/types/common.types.ts`.

### Hook patrón (useStalledDeals)
```ts
export const useStalledDeals = () => useQuery({
  queryKey: ['dashboard', 'stalled-deals'],
  queryFn: dashboardApi.getStalledDeals,
});
```

### API patrón (dashboard.api.ts)
```ts
import { api } from '@/shared/lib/axios';
getStalledDeals: async (): Promise<StalledDeal[]> => {
  const res = await api.get<StalledDeal[]>('/dashboard/stalled-deals');
  return res.data;
},
```

### Tipos (dashboard.types.ts) — convención PascalCase iface, camelCase props
`StalledDeal { dealId, clientName, sellerName, stage, amount, daysStalled, severity }`.

### Formato
`shared/lib/format.ts` → `formatCurrency`. Para puntos: `value.toLocaleString('es-MX')`.

### Componentes / CSS
Patrón tabla manual `<table>` o cards (ver SellerSemaphoreTable / Stalled deals). Clases: `.card`, `.dt`/`.dt th`/`.dt td`, `.tag .tag-green/.tag-red/.tag-navy`, `.prog/.prog-fill`. Vars color en `index.css`.
