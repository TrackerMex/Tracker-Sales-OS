# Review — 18-phase3-hardening (items 3.2 y 3.3)

**Fecha**: 2026-06-11
**Agente**: Reviewer
**Veredicto global**: PASSED (11/11 criterios)

## Item 3.2 — dailyCallsGoal

### 1. Entity con default 10 — PASSED
`backend/src/modules/settings/domain/entities/setting.entity.ts`
- `AppSettings.dailyCallsGoal: number` (línea 3) y `DEFAULT_SETTINGS.dailyCallsGoal = 10` (línea 11).

### 2. DTO con validación — PASSED
`backend/src/modules/settings/application/dtos/update-settings.dto.ts:5`
- `@IsOptional() @IsNumber() @Min(1) dailyCallsGoal?: number;` — idéntico al patrón de `dailyMinPoints`.

### 3. Merge con defaults en GetSettings — PASSED
`backend/src/modules/settings/application/use-cases/get-settings.use-case.ts:31`
- `this.cache = { ...DEFAULT_SETTINGS, ...(row.value as unknown as AppSettings) }` — filas jsonb
  persistidas antes del cambio exponen `dailyCallsGoal: 10` sin migration. `UpdateSettingsUseCase`
  hace spread del current, así que el primer PATCH persiste el objeto completo.

### 4. get-mi-dia usa settings — PASSED
`backend/src/modules/dashboard/application/use-cases/get-mi-dia.use-case.ts:134`
- `dailyCallsGoal: settings.dailyCallsGoal ?? 10`.
- Mismo mecanismo que `dailyMinPoints`: `GetSettingsUseCase` inyectado por constructor (línea 25),
  un solo `execute()` dentro del `Promise.all` inicial (líneas 35-40). Sin doble fetch — además el
  use-case cachea en memoria.

### 5. Frontend tipo + input — PASSED
- `frontend/src/modules/settings/domain/settings.types.ts` — `dailyCallsGoal: number` en `AppSettings`
  (requerido) y `dailyCallsGoal?: number` en `UpdateSettingsInput`.
- `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx`:
  - Label español `'Meta diaria de llamadas'` en `FIELD_LABELS` (línea 12).
  - Default 10 en estado inicial del form (línea 28) → el render itera `Object.keys(form)`, el input
    aparece con el mismo patrón `FieldError`/`FormErrorSummary`/`fieldErrorProps` existente.
  - `min={1}` para `dailyCallsGoal` (línea 73), coherente con `@Min(1)` del backend.

## Item 3.3 — Gating por rol

### 6. Hooks con enabled por rol — PASSED
- `frontend/src/modules/equipo/application/hooks/useSellers.ts:12` y
  `frontend/src/modules/settings/application/hooks/useSettings.ts:12`:
  `enabled: role === UserRole.Admin || role === UserRole.Director`.
- Rol leído de `useAppStore((s) => s.currentUser?.role)` — store correcto
  (`frontend/src/shared/store/app.store.ts`, `currentUser: AuthUser | null`).
- `UserRole` importado de `@/core/domain/types/common.types` (sin editarlo).

### 7. Consumidores toleran undefined (Seller) — PASSED
- `ClientesPage.tsx:125-126` — `(sellersData ?? []).filter(...)`. Sin cambios necesarios.
- `CoachingPage.tsx` (Seller):
  - `sellers === undefined` → `currentSeller` undefined → usa `sellerFallback` (ya existía).
  - **Fallback minDaily verificado**: línea 170-171 — `useCoachingDaily(!isAdmin ? currentSellerId : null)`
    + `minDaily = settingsData?.dailyMinPoints ?? ownDaily?.dailyPointsGoal ?? 30`. Sin request a
    /settings: el dato viene de `GET /coaching/daily` (backend `get-coaching-daily.use-case.ts:96`
    calcula `dailyPointsGoal = settings.dailyMinPoints ?? 30` y lo expone en `coaching-daily.dto.ts:11`).
  - Sin request duplicado: la queryKey `['coaching','daily',currentSellerId]` es la misma que usa
    `SellerCoachingCard` para el Seller (`seller.id === currentSellerId`) → TanStack Query dedupea.
  - Para Admin/Director: `useCoachingDaily(null)` → `enabled: !!sellerId` = false, no dispara nada.

### 8. EquipoPage y SettingsPage sin regresión — PASSED
- `EquipoPage.tsx` — usa `sellers?.filter(...)` / `sellers?.map(...)` (optional chaining); página
  Admin/Director-only, donde la query sigue habilitada. Sin cambios en el archivo.
- `SettingsPage.tsx` — Admin/Director-only; query habilitada para ambos; submit sigue restringido
  a Admin como antes. Cambios limitados a agregar el campo nuevo.

## Generales

### 9. Convenciones — PASSED
- Imports "hacia adentro": páginas → application/hooks; hooks → infrastructure (`equipoApi`,
  `settingsApi`); `api.*` solo en `infrastructure/*.api.ts`. Backend: dashboard usa el use-case de
  settings (application → application entre módulos, patrón ya establecido para dailyMinPoints).
- Código y comentarios en inglés; labels de UI en español (correcto, es texto de dominio).
- Sin emojis.

### 10. Alcance del diff — PASSED
`git diff --stat`: ningún archivo bajo `backend/src/core/` ni `frontend/src/core/`.
Archivos tocados por el Implementer (10): settings entity/dto/use-case, get-mi-dia, settings.types,
SettingsPage, useSellers, useSettings, CoachingPage, pipeline.types.
(Los otros 3 del diff — `.claude/agents/leader.md`, `AGENTS.md`, `feature_list.json` — son cambios
del Líder previos/de tracking, no de esta implementación.)
- **Desviación documentada validada**: `pipeline.types.ts` agrega `createdAt?: string` a `Deal`.
  Confirmado en backend: `deal.dto.ts:16` declara `createdAt: Date` y `:38` lo asigna
  (`dto.createdAt = entity.createdAt`), con `@CreateDateColumn` en `deal.typeorm.entity.ts:32`.
  El backend sí lo devuelve (serializado como ISO string); el fix es legítimo y mínimo
  (desbloquea `DealCard.tsx:97`, build roto pre-existente en main).

### 11. Builds — PASSED
- Backend: `npx tsc --noEmit` → exit 0 (2026-06-11).
- Frontend: `npm run build` (tsc -b && vite build) → exit 0 (2026-06-11).

## Notas (no bloqueantes)

1. El backend permite Seller en `GET /settings` (`settings.controller.ts:21` —
   `@Roles(Admin, Director, Seller)`). El gating frontend cumple igual el criterio (Seller no
   dispara GET /settings ni GET /sellers); la fuente real de los 403 era `GET /sellers`
   (Admin/Director-only). Opcional para el futuro: endurecer el GET del backend a Admin/Director
   ya que ningún flujo Seller lo consume.
2. Pendiente smoke 3.5 (runtime): PATCH dailyCallsGoal → mi-dia lo refleja; consola sin 403 como
   Seller en /clientes y /coaching; audit_logs al mover deal. Cubierto por qa-tester según plan.
