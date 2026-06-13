# Review Feature 20 — Deals Estancados
Fecha: 2026-06-13

## Checkpoints

1. [PASS] `AppSettings` tiene `stalledAmberDays: number` (default 7) y `stalledRedDays: number` (default 14) en `setting.entity.ts`
2. [PASS] `UpdateSettingsDto` acepta ambos campos opcionales con `@IsOptional, @IsNumber, @Min(1)`
3. [PASS] `IDealsRepository` expone `findStalledDeals(amberDays: number): Promise<{deal, daysStalled}[]>`
4. [PASS] `DealRepositoryImpl.findStalledDeals` excluye Cierre/Perdido y calcula daysStalled vía JSONB
5. [PASS] `StalledDealDto` tiene todos los campos: dealId, clientName, sellerName, stage, amount, daysStalled, severity
6. [PASS] `GetStalledDealsUseCase` inyecta DEAL_REPOSITORY + GetSettingsUseCase, mapea severity correctamente
7. [PASS] `GET /dashboard/stalled-deals` con @Roles(Admin, Director)
8. [PASS] `DashboardModule` registra GetStalledDealsUseCase
9. [PASS] Frontend `AppSettings` e `UpdateSettingsInput` tienen ambos campos nuevos
10. [PASS] `SettingsPage` tiene campos para stalledAmberDays y stalledRedDays
11. [PASS] `StalledDeal` interface en `dashboard.types.ts`
12. [PASS] `dashboard.api.ts` tiene `getStalledDeals()` → GET /dashboard/stalled-deals
13. [PASS] `DashboardPage` muestra sección "Deals en riesgo" (solo Admin/Director)
14. [PASS] `DealCard` calcula daysStalled desde stageHistory y muestra badge ámbar/rojo

## Resultado: 14/14 PASS
