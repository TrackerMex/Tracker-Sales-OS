# impl 23-cold-accounts

Feature: cuentas frías / data freshness. Un cliente es frío si `max(lastActivityAt, createdAt) < (ahora - coldAccountDays)`. Default `coldAccountDays = 14`.

## Archivos tocados

### PARTE A — Settings (umbral coldAccountDays, default 14)
- `backend/src/modules/settings/domain/entities/setting.entity.ts`: `coldAccountDays: number` en `AppSettings`; `coldAccountDays: 14` en `DEFAULT_SETTINGS`.
- `backend/src/modules/settings/application/dtos/update-settings.dto.ts`: `@IsOptional() @IsNumber() @Min(1) coldAccountDays?: number`.
- `frontend/src/modules/settings/domain/settings.types.ts`: campo en `AppSettings` y `UpdateSettingsInput`.
- `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx`: label "Días sin contacto para cuenta fría", default en estado del form (14), y `coldAccountDays` agregado a la lista `min={1}`. El form itera dinámicamente sobre las keys, así que el campo se renderiza solo.

### PARTE B — Backend clients (lastActivityAt + isCold + filtro cold)
- `backend/src/modules/clients/application/dtos/client.dto.ts`: import `Transform`; `ClientDto.lastActivityAt: string | null` e `isCold: boolean`; `GetClientsQueryDto.cold?: boolean` con `@Transform(value === true || 'true')` + `@IsBoolean()`.
- `backend/src/modules/clients/domain/repositories/client.repository.interface.ts`: `ClientFilters.coldBefore?: Date`.
- `backend/src/modules/clients/infrastructure/repositories/client.repository.impl.ts`: en `findWithFilters`, filtro `coldBefore` con `client.createdAt < :coldBefore` + `NOT EXISTS` sobre `activities` (deleted_at IS NULL, executed_at >= :coldBefore).
- `backend/src/modules/clients/application/use-cases/get-clients.use-case.ts`: inyecta `Repository<ActivityTypeormEntity>` y `GetSettingsUseCase`. Calcula `coldBefore`, pasa `coldBefore` al repo solo cuando `query.cold`. Nuevo `getLastActivityMap(ids)` (GROUP BY a.client_id, MAX(a.executed_at)). `toDto` setea `lastActivityAt` (ISO o null) e `isCold = max(last, createdAt) < coldBefore`. Se preserva la lógica de seller por rol existente.
- `backend/src/modules/clients/clients.module.ts`: `ActivityTypeormEntity` en `forFeature`; `SettingsModule` en `imports`.

### PARTE C — Backend Mi Día (coldAccountsCount)
- `backend/src/modules/dashboard/application/dtos/mi-dia.dto.ts`: `coldAccountsCount: number`.
- `backend/src/modules/dashboard/application/use-cases/get-mi-dia.use-case.ts`: `coldBefore` desde settings; query de conteo agregado al segundo `Promise.all` (`c.seller_id`, `c.deleted_at IS NULL`, `c.created_at < :coldBefore`, `NOT EXISTS` sobre activities). `coldAccountsCount` en el retorno. Columnas verificadas en client.typeorm.entity.ts (seller_id / created_at / deleted_at).

### PARTE D — Frontend clients
- `frontend/src/modules/clients/domain/clients.types.ts`: `Client.lastActivityAt`, `Client.isCold`; `ClientFilters.cold?`.
- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`: estado `cold`, `filters` incluye `cold: cold || undefined`, toggle chip "Sin contacto" (btn-primary activo / btn-ghost inactivo), línea "Última actividad" por card (formatDate o "Sin actividad"), badge `tag tag-red` "Fría" cuando `isCold`.
- `clients.api.ts` / `useClients.ts`: sin cambios (cleanParams + spread genérico ya soportan `cold`).

### PARTE E — Frontend Mi Día
- `frontend/src/modules/mi-dia/domain/mi-dia.types.ts`: `coldAccountsCount: number`.
- `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx`: bloque alerta naranja (#FFF7ED / #FDBA74) debajo del bloque de vencidos cuando `coldAccountsCount > 0`, con pluralización.

## Verificación
- `cd backend && npx tsc --noEmit` -> exit 0.
- `cd frontend && npx tsc --noEmit` -> exit 0.

## Notas
- No hay migración: settings es JSONB key-value y `GetSettingsUseCase` mergea con `DEFAULT_SETTINGS`, así que `coldAccountDays` aparece aunque la fila se haya creado antes.
