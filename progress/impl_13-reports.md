# impl_13-reports — Executive Reports

## Archivos creados

### Backend
- `backend/src/modules/reports/application/dtos/monthly-report.dto.ts` — DTO con interfaces SellerSalesReport, TypeReport, SourceBreakdown y clase MonthlyReportDto
- `backend/src/modules/reports/application/use-cases/get-monthly-report.use-case.ts` — use case con 3 queries: agrupación por type+clientType, por seller con JOIN a sellers, y por source
- `backend/src/modules/reports/presentation/reports.controller.ts` — reemplazado stub; solo GET /monthly con guard Admin+Director
- `backend/src/modules/reports/reports.module.ts` — reemplazado stub; registra SaleTypeormEntity, SellerTypeormEntity, AuthModule

### Frontend
- `frontend/src/modules/reports/domain/reports.types.ts` — interfaces TypeScript del DTO
- `frontend/src/modules/reports/infrastructure/reports.api.ts` — llamada GET /reports/monthly con params
- `frontend/src/modules/reports/application/hooks/useMonthlyReport.ts` — useQuery con queryKey ['reports','monthly', month]
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx` — página completa con selector de mes, barra salud comercial, 4 tarjetas resumen, tabla por tipo, tabla vendedores, tabla por origen
- `frontend/src/routes/_app/reportes.tsx` — reemplazado placeholder; importa ReportsPage

## Decisiones de diseño

- El use case agrupa por `type` Y `clientType` en una sola query y luego agrega en memoria para calcular newUnits/existingUnits por tipo; evita múltiples sub-queries
- La query de sellers usa `innerJoin` directo al SellerTypeormEntity (sin alias de tabla separado) para obtener el nombre
- `commercialHealth = min(100, round((amount/600k)*50 + (units/150)*50))` — pesos iguales 50/50
- Metas hardcodeadas: $600,000 y 150 unidades (pendiente settings feature 14)
- Frontend: el selector type="month" devuelve YYYY-MM nativo del browser, sin librería adicional

## Resultado tsc --noEmit

- Backend: PASS (sin errores)
- Frontend: PASS (sin errores)
