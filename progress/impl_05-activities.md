# impl_05-activities

## Archivos creados/modificados

### Backend (nuevos)
- `backend/src/modules/activities/application/dtos/create-activity.dto.ts`
- `backend/src/modules/activities/application/dtos/activity.dto.ts` — DTO de respuesta con `static fromEntity()`
- `backend/src/modules/activities/application/dtos/get-activities-query.dto.ts`
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.ts`
- `backend/src/modules/activities/application/use-cases/get-daily-activities.use-case.ts`
- `backend/src/modules/activities/application/use-cases/get-seller-activities.use-case.ts`
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts` — 7 tests unitarios
- `backend/src/modules/activities/infrastructure/entities/activity.typeorm.entity.ts`
- `backend/src/modules/activities/infrastructure/repositories/activity.repository.impl.ts`

### Backend (reemplazados)
- `backend/src/modules/activities/presentation/activities.controller.ts`
- `backend/src/modules/activities/activities.module.ts`

### Frontend (nuevos)
- `frontend/src/modules/activities/infrastructure/activities.api.ts`
- `frontend/src/modules/activities/application/hooks/useCreateActivity.ts`
- `frontend/src/modules/activities/application/hooks/useDailyActivities.ts`
- `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`

### Frontend (actualizados)
- `frontend/src/modules/activities/domain/activities.types.ts` — añade `contactId`, `nextTime`, `createdAt` en `Activity`; renombra `CreateActivityDto` → `CreateActivityInput`; añade `DailyActivitiesResponse`
- `frontend/src/routes/_app/actividades.nueva.tsx` — reemplaza placeholder con `ActivitiesPage`

## Resultado tsc

No se pudo ejecutar `tsc --noEmit` por falta de permisos de terminal. Revisión manual:
- Backend: `noImplicitAny: false`, `strictNullChecks: true` — leniente. Todos los tipos verificados manualmente.
- Frontend: `strict: true`, `verbatimModuleSyntax: true` — todos los imports type-only usan `import type`, sin locales/parámetros no usados.

## Decisiones de implementación

1. **`Roles` decorator**: el spec indicaba `infrastructure/decorators/` pero el archivo real está en `presentation/decorators/roles.decorator.ts` — se usó el path correcto.

2. **`findDailyBySeller` / `sumDailyPoints`**: en vez del DATE(...AT TIME ZONE 'UTC') como raw SQL (que requeriría usar el nombre de columna físico `executed_at`), se usa rango UTC explícito (`start.setUTCHours(0,0,0,0)` / `end.setUTCHours(23,59,59,999)`) con property names de TypeORM. Más robusto y portable.

3. **`ActivityDto.fromEntity` como callback de map**: se usa como referencia directa (`activities.map(ActivityDto.fromEntity)`). En TypeScript, una función con menos parámetros es asignable a una con más, así que es válido.

4. **`CreateActivityDto` renombrado a `CreateActivityInput` en frontend**: consistencia con la convención de `*Input` para payloads de entrada en el dominio frontend (vs `*Dto` que es terminología de NestJS).
