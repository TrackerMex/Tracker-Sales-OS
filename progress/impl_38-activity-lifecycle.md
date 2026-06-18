# Feature 38: Ciclo de vida independiente por actividad

## Archivos modificados

### Backend
- `backend/src/modules/activities/domain/entities/activity.entity.ts` — Added `ActivityStatus` type, `ActivityHistoryEntry` interface, `status` and `activityHistory` fields to `ActivityEntity`
- `backend/src/modules/activities/infrastructure/entities/activity.typeorm.entity.ts` — Added `status` (varchar default 'Pendiente') and `activityHistory` (jsonb default []) columns
- `backend/src/modules/activities/application/dtos/activity.dto.ts` — Added `status` and `activityHistory` fields + mapping in `fromEntity()`
- `backend/src/modules/activities/domain/repositories/activity.repository.interface.ts` — Added `updateStatus()` and `findByClientId()` to interface
- `backend/src/modules/activities/infrastructure/repositories/activity.repository.impl.ts` — Implemented `updateStatus()` and `findByClientId()`
- `backend/src/modules/activities/presentation/activities.controller.ts` — Added `GET /activities/:id` and `PATCH /activities/:id/status` endpoints
- `backend/src/modules/activities/activities.module.ts` — Added `UpdateActivityStatusUseCase` to providers
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts` — Added missing mock methods `updateStatus` and `findByClientId`

### Backend (new files)
- `backend/src/modules/activities/application/use-cases/update-activity-status.use-case.ts` — Use case enforcing valid status transitions and persisting history entries

### Frontend
- `frontend/src/modules/activities/domain/activities.types.ts` — Added `ActivityStatus` type, `ActivityHistoryEntry` interface, `status` and `activityHistory` to `Activity`
- `frontend/src/modules/activities/infrastructure/activities.api.ts` — Added `getActivityById`, `getClientActivities`, `updateActivityStatus`
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx` — Added status badge + "Ver historial" button per activity, integrated `ActivityHistoryModal`

### Frontend (new files)
- `frontend/src/modules/activities/application/hooks/useActivityHistory.ts` — `useActivityById` and `useUpdateActivityStatus` hooks
- `frontend/src/modules/activities/presentation/components/ActivityHistoryModal.tsx` — Modal showing individual activity status + history entries with transition buttons

## TypeScript checks
- `pnpm tsc --noEmit` backend: exit 0
- `pnpm tsc --noEmit` frontend: exit 0
