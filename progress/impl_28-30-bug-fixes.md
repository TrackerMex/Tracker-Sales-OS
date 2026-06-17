# Bug Fixes: 28, 30A, 30B

## Archivos modificados

### FIX 1 — Bug 28: findConflictingTask causa 500
**Archivo:** `backend/src/modules/tasks/infrastructure/repositories/task.repository.impl.ts`

**Cambio:** Reemplazado `date_trunc('minute', task.scheduled_at)` con comparación de rango usando propiedad TypeORM.
- Antes: SQL raw con `date_trunc` y `::timestamptz` — causaba `QueryFailedError` 500 en creación de tareas
- Después: cálculo de `minuteStart` / `minuteEnd` en JS, comparación con `task.scheduledAt` (propiedad TypeORM, no columna DB)

### FIX 2 — Bug 30A: Creación de cliente falla por email vacío
**Archivo:** `backend/src/modules/clients/application/dtos/client.dto.ts`

**Cambio:** Agregado `@Transform` al campo `email` en `CreateContactDto`.
- Antes: `@IsOptional()` + `@IsEmail()` fallaba con 400 cuando el frontend enviaba `email: ""`
- Después: `@Transform` convierte string vacío a `undefined` antes de que `@IsEmail()` valide
- `Transform` ya estaba importado desde `class-transformer` — no se requirió cambio de imports

### FIX 3 — Bug 30B: Prospectos hoy = 0 por fechas local vs UTC
**Archivo:** `backend/src/modules/dashboard/application/use-cases/get-mi-dia.use-case.ts`

**Cambio:** Reemplazado `new Date(year, month, day)` (hora local) con `Date.UTC(...)` (hora UTC explícita).
- Antes: rangos de fecha calculados en timezone del servidor — no coincidían con timestamps UTC en DB
- Después: `todayStart`, `todayEnd`, `tomorrowStart`, `tomorrowEnd` usan `getUTCFullYear/Month/Date`

## Resultado de `tsc --noEmit`

Sin errores de TypeScript. Solo warnings de configuración npm irrelevantes.
