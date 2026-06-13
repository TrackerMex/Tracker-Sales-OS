# Explore 25 — Reports

## Backend
- Use case mensual: `backend/src/modules/reports/application/use-cases/get-monthly-report.use-case.ts` — inyecta SaleTypeormEntity + SellerTypeormEntity. (NO tocar.)
- DTO: `backend/src/modules/reports/application/dtos/monthly-report.dto.ts` → `MonthlyReportDto` (direction/atc/team/total/sellers/bySource/commercialHealth).
- Controller: `backend/src/modules/reports/presentation/reports.controller.ts` — `@Get('monthly') @Roles(Admin,Director)`, guards `JwtAuthGuard, RolesGuard`. Aquí va el nuevo `@Get('win-loss')`.
- Módulo: `backend/src/modules/reports/reports.module.ts` — imports `[TypeOrmModule.forFeature([Sale, Seller]), AuthModule]`. **Añadir `PipelineModule`** para inyectar `DEAL_REPOSITORY`.
- Sin tests en reports.

## Frontend
- `domain/reports.types.ts` → `MonthlyReport`. Añadir tipos win/loss.
- `infrastructure/reports.api.ts` → `getMonthly(month)`. Añadir `getWinLoss()`.
- `application/hooks/useMonthlyReport.ts` → queryKey `['reports','monthly',month]`. Crear `useWinLoss` análogo.
- `presentation/pages/ReportsPage.tsx`: secciones con tablas `.dt`, cards, `.kpi-strip`, `.slabel`, botones `.btn-*`. Insertar sección win/loss antes de "Análisis Ejecutivo IA".

## Decisión de diseño
Endpoint SEPARADO `GET /api/reports/win-loss` (all-time, sin filtro de mes) — no inflar el query mensual. Cómputo in-memory desde `DEAL_REPOSITORY.findAllForAnalysis()`.
