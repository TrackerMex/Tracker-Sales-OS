# Feature 19 — Forecast ponderado del pipeline

Forecast ponderado = `SUM(deal.amount * deal.probability / 100)`, excluyendo stage `Perdido` y soft-deleted.

## Backend

### `pipeline/domain/repositories/deal.repository.interface.ts`
- Agregada la firma `getWeightedForecast(): Promise<number>;` al interface `IDealsRepository`.

### `pipeline/infrastructure/repositories/deal.repository.impl.ts`
- Implementado `getWeightedForecast()` con QueryBuilder usando `SUM(d.amount * d.probability / 100)` (aritmética numeric, en ese orden), `COALESCE(..., 0)`, filtro `stage != Perdido` y `deleted_at IS NULL`. Retorna `Number(raw?.forecast) || 0`.

### `dashboard/application/dtos/dashboard-summary.dto.ts`
- Agregado campo `pipelineForecast: number;`.

### `dashboard/dashboard.module.ts`
- Importado `PipelineModule` en `imports` (expone el token `DEAL_REPOSITORY`).

### `dashboard/application/use-cases/get-dashboard-summary.use-case.ts`
- Importado `Inject` (de `@nestjs/common`) e `IDealsRepository`.
- Inyectado `@Inject('DEAL_REPOSITORY') private dealRepo: IDealsRepository` en el constructor.
- Antes del return: `const pipelineForecast = await this.dealRepo.getWeightedForecast();` y agregado `pipelineForecast` al objeto retornado.

## Frontend

### `shared/lib/format.ts` (NUEVO)
- Helper `formatCurrency(value)` reutilizable (versión robusta extraída de DashboardPage).

### `dashboard/domain/dashboard.types.ts`
- Agregado `pipelineForecast: number;` a `DashboardSummary`.

### `dashboard/presentation/components/KPIStrip.tsx`
- Agregadas props `forecastValue: string` y `forecastSubtitle: string`.
- Nuevo 5º `kpi-cell` "Forecast del mes" con tooltip, valor `fmt(forecastValue)` y subtítulo `fmt(forecastSubtitle)`.

### `dashboard/presentation/pages/DashboardPage.tsx`
- Eliminada la función local `formatCurrency`; ahora se importa desde `@/shared/lib/format`.
- Importado y usado `useSettings()`; `goal = monthlyAmountGoal ?? 600000`.
- Calculado `forecast = data?.pipelineForecast ?? 0` y `pct = Math.round((forecast / goal) * 100)`.
- Pasadas a `<KPIStrip>` las props `forecastValue` y `forecastSubtitle` (`${pct}% de meta ${formatCurrency(goal)}`).

### `pipeline/presentation/pages/PipelinePage.tsx`
- Importado `formatCurrency`.
- Calculado desde `grouped`: `openDeals` (excluye Perdido), `totalGross` y `forecast`.
- Header convertido en flex row: título a la izquierda; a la derecha "Total bruto" y "Forecast ponderado" (solo cuando hay `grouped`), con colores `#002B49` / `#94A3B8`.

## Resultado tsc
- Frontend: `tsc --noEmit` exit 0 (limpio).
- Backend: el código fuente compila limpio (sin errores fuera de tests). Queda 1 error de tipos en un archivo de test (`activities/application/use-cases/create-activity.use-case.spec.ts`): el mock `makeMockDealRepo` no implementa el nuevo método del interface. No se tocó por la regla "NO tocar tests". Fix pendiente (1 línea): agregar `getWeightedForecast: jest.fn(),` al objeto `makeMockDealRepo` (~línea 27).

## Notas
- No se agregaron dependencias, tablas ni migraciones.
- No se tocaron archivos de tests.
