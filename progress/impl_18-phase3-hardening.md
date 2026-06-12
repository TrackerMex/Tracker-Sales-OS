# Impl — 18-phase3-hardening (items 3.2 y 3.3)

**Fecha**: 2026-06-11
**Agente**: Implementer

## Item 3.2 — dailyCallsGoal dinámico desde Settings

### Backend

- `backend/src/modules/settings/domain/entities/setting.entity.ts`
  - `AppSettings.dailyCallsGoal: number` agregado; `DEFAULT_SETTINGS.dailyCallsGoal = 10`.
- `backend/src/modules/settings/application/dtos/update-settings.dto.ts`
  - `@IsOptional() @IsNumber() @Min(1) dailyCallsGoal?: number;`
- `backend/src/modules/settings/application/use-cases/get-settings.use-case.ts`
  - Al cargar la fila existente, ahora hace merge con defaults:
    `this.cache = { ...DEFAULT_SETTINGS, ...(row.value as unknown as AppSettings) }`.
    Esto backfillea `dailyCallsGoal` en filas persistidas antes del cambio sin
    necesidad de migration (settings vive como una sola fila jsonb bajo key
    `app_settings`; UpdateSettingsUseCase ya hace spread de `current`, así que
    el primer PATCH persiste el valor completo).
- `backend/src/modules/dashboard/application/use-cases/get-mi-dia.use-case.ts:134`
  - `dailyCallsGoal: settings.dailyCallsGoal ?? 10` (mismo patrón que dailyMinPoints).

### Migrations

No existen migrations en `backend/src/database/migrations/` y la tabla settings
no tiene columnas por campo (jsonb), por lo que no se creó migration. El default
se inyecta por código (merge de defaults en GetSettingsUseCase).

### Frontend

- `frontend/src/modules/settings/domain/settings.types.ts`
  - `dailyCallsGoal` agregado a `AppSettings` (requerido) y `UpdateSettingsInput` (opcional).
- `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx`
  - Label `dailyCallsGoal: 'Meta diaria de llamadas'` en `FIELD_LABELS`.
  - Default `dailyCallsGoal: 10` en el estado inicial del form (el render itera
    `Object.keys(form)`, así que el input aparece automáticamente con el mismo
    patrón FieldError/FormErrorSummary).
  - `min={1}` para `dailyCallsGoal` (igual que `dailyMinPoints`, coincide con `@Min(1)`).

## Item 3.3 — Gating por rol en hooks

- `frontend/src/modules/equipo/application/hooks/useSellers.ts`
  - `enabled: role === UserRole.Admin || role === UserRole.Director` leyendo rol
    de `useAppStore((s) => s.currentUser?.role)`.
- `frontend/src/modules/settings/application/hooks/useSettings.ts`
  - Mismo gating.
- `frontend/src/modules/coaching/presentation/pages/CoachingPage.tsx`
  - Con settings gateado, `minDaily` para Seller ya no puede venir de `/settings`.
    Se agregó a nivel página `useCoachingDaily(!isAdmin ? currentSellerId : null)`
    (misma queryKey que la card → TanStack dedupea, no hay request extra) y:
    `minDaily = settingsData?.dailyMinPoints ?? ownDaily?.dailyPointsGoal ?? 30`.
    El reporte de coaching (`CoachingDaily.dailyPointsGoal`) ya trae el valor de
    settings calculado en backend y es accesible para Seller.

### Consumidores verificados

- `ClientesPage.tsx:125-126` — ya tolera undefined (`(sellersData ?? []).filter(...)`). Sin cambios.
- `CoachingPage.tsx` — Seller usa `sellerFallback` cuando `sellers === undefined` (ya existía); minDaily ajustado como arriba.
- `EquipoPage.tsx` y `SettingsPage.tsx` — solo Admin/Director, queries siguen habilitadas para esos roles; comportamiento sin cambios.

## Desviaciones / hallazgos

1. **Build frontend roto en main (pre-existente)**: `DealCard.tsx:97` usa
   `deal.createdAt` pero `Deal` no lo declaraba → `tsc -b` fallaba antes de mis
   cambios. El backend sí devuelve `createdAt` en `DealDto`. Fix mínimo:
   `createdAt?: string` agregado en `frontend/src/modules/pipeline/domain/pipeline.types.ts`.
2. **Nota**: el backend actualmente permite Seller en `GET /settings`
   (`settings.controller.ts` → `@Roles(Admin, Director, Seller)` en GET), a
   diferencia de lo que indica el plan. El gating frontend se aplicó igual según
   el criterio de éxito (Seller no dispara GET /settings ni GET /sellers); el
   dato que Seller necesita viene del reporte de coaching. `GET /sellers` sí es
   Admin/Director-only y era la fuente real de los 403.

## Builds

- Backend `npx tsc --noEmit`: PASS (2026-06-11)
- Frontend `npm run build` (tsc -b && vite build): PASS (2026-06-11) — solo warning de chunk >500 kB (pre-existente)

## Pendiente de verificación runtime (smoke 3.5)

- PATCH `/api/settings` `{"dailyCallsGoal": 15}` → GET lo devuelve.
- GET `/api/dashboard/mi-dia/seller/:id` → `dailyCallsGoal` = 15.
- Consola sin 403 como Seller en /clientes y /coaching.

## Fix post-QA (2026-06-11)

**Regresión detectada en QA**: el gating por rol en `useSettings.ts` (item 3.3)
era incorrecto. El backend SÍ permite Seller en `GET /settings`
(`settings.controller.ts` → `@Roles(Admin, Director, Seller)` en GET), y
SettingsPage tiene una vista read-only para Seller/Director. Con la query
disabled, el Seller veía los DEFAULTS del frontend (ej. dailyMinPoints 30) en
vez de los valores reales de la DB (ej. 35) — datos falsos silenciosos,
verificado en browser en /configuracion.

**Fix**: revert del gating en
`frontend/src/modules/settings/application/hooks/useSettings.ts` — la query
vuelve a ejecutarse para cualquier usuario autenticado (como antes de la
feature 18). Imports sin uso (`useAppStore`, `UserRole`) eliminados.

- `useSellers.ts` NO se tocó: `GET /sellers` sí es Admin/Director-only en
  backend y su gating es correcto.
- `CoachingPage.tsx` sin cambios: `minDaily = settingsData?.dailyMinPoints ??
  ownDaily?.dailyPointsGoal ?? 30` — con la query habilitada, el Seller recibe
  settings reales de nuevo (primer operando), lo cual es correcto; el fallback
  a `ownDaily` queda como red de seguridad.
- Build frontend `npm run build` (tsc -b && vite build): PASS post-fix.
