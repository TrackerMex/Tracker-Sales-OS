# impl_45-authz-tasks-activities

Fecha: 2026-07-01
Feature: `45-authz-tasks-activities` — fix de autorización (IDOR B1/B3/B4)

## Resumen

Las mutaciones de tasks y activities ya no confían en `sellerId` del body: la identidad se deriva del JWT (`req.user.role` + `req.user.sellerId`). Seller solo opera sus propios recursos (403 en ajenos); Admin/Director hacen bypass del check de ownership.

## Archivos modificados

### Backend — tasks

- `backend/src/modules/tasks/presentation/tasks.controller.ts`
  - `POST /tasks`: agrega `@Request() req`; si role Seller sin `sellerId` lanza `ForbiddenException`; si Seller, fuerza `dto.sellerId = req.user.sellerId` (ignora el del body). Admin/Director conservan el sellerId del dto.
  - `PATCH :id/complete`, `PATCH :id`, `PATCH :id/reactivate`, `DELETE :id`: eliminado `@Body('sellerId')`; ahora pasan `callerRole` y `callerSellerId` desde `req.user` a los use-cases.
- `backend/src/modules/tasks/application/dtos/update-task.dto.ts`
  - Eliminado `sellerId?` del DTO (el body ya no puede aportar sellerId al update).
- `backend/src/modules/tasks/application/use-cases/complete-task.use-case.ts`
- `backend/src/modules/tasks/application/use-cases/update-task.use-case.ts`
- `backend/src/modules/tasks/application/use-cases/reactivate-task.use-case.ts`
- `backend/src/modules/tasks/application/use-cases/delete-task.use-case.ts`
  - Inputs cambiados de `sellerId: string` a `callerRole: string; callerSellerId: string | null`.
  - Ownership check: `if (input.callerRole === UserRole.Seller && task.sellerId !== input.callerSellerId) throw ForbiddenException`. Admin/Director bypass.
  - `UserRole` importado desde `../../../auth/domain/entities/user.entity`.
  - `update-task.use-case.ts` (detalle crítico): `findConflictingTask` ahora valida contra `task.sellerId` (dueño de la tarea) en vez de la identidad del caller — el conflicto de horario se evalúa correctamente cuando Admin/Director editan tareas ajenas.
- `create-task.use-case.ts`: sin cambios (el controller fuerza el dto).

### Backend — activities

- `backend/src/modules/activities/presentation/activities.controller.ts`
  - `POST /activities`: agrega `@Request() req`; si role Seller sin `sellerId` lanza `ForbiddenException`; si Seller, fuerza `dto.sellerId = req.user.sellerId`.
  - `PATCH :id/status`: ahora `async`; carga la actividad con `activityRepo.findById(id)`; `NotFoundException` si no existe; `ForbiddenException` si Seller y `activity.sellerId !== req.user.sellerId`. Tipo del `@Request()` ampliado a `{ id, username, role, sellerId }`; `changedBy: req.user.username` se conserva.
  - GETs sin cambios (historial de cliente compartido entre sellers — decisión documentada).
  - `update-activity-status.use-case.ts`: sin cambios (el check vive en el controller, que ya tiene el repo inyectado).

### Frontend — tasks

- `frontend/src/modules/tasks/infrastructure/tasks.api.ts`
  - `completeTask(taskId)` → `PATCH /tasks/:id/complete` con body `{}`.
  - `updateTask(taskId, input)` → `PATCH /tasks/:id` con `input` (sin sellerId).
  - `reactivateTask(taskId)` → `PATCH /tasks/:id/reactivate` con body `{}`.
  - `deleteTask(taskId)` → `DELETE /tasks/:id` sin body.
  - `createTask` sin cambios.
- `frontend/src/modules/tasks/application/hooks/useCompleteTask.ts`
- `frontend/src/modules/tasks/application/hooks/useUpdateTask.ts`
- `frontend/src/modules/tasks/application/hooks/useReactivateTask.ts`
- `frontend/src/modules/tasks/application/hooks/useDeleteTask.ts`
  - Eliminada la resolución `currentUser?.sellerId ?? currentUser?.id` y el import de `useAppStore` (quedaba sin uso). Firmas externas de los hooks intactas (mutate recibe `taskId` / `{ taskId, input }`).
  - `useCreateTask.ts` sin cambios.
- Páginas (AgendaPage, MiDiaPage, EditTaskForm, CreateTaskForm, CalendarView): verificado que ninguna pasa sellerId a estas mutaciones — sin cambios necesarios. `UpdateTaskInput` (frontend/src/modules/tasks/domain/tasks.types.ts) ya no tenía sellerId.

## Decisiones

- El check de ownership de activities status se hace en el controller (repo ya inyectado ahí), imitando el patrón inline existente; el use-case no cambia.
- `callerRole` se tipa como `string` (igual que el shape de `req.user` del jwt.strategy) y se compara contra el enum `UserRole`.

## Verificación (CHECKPOINT 45)

- `npx tsc --noEmit` en `backend/` → exit 0.
- `npx tsc --noEmit` en `frontend/` → exit 0.
- Criterios 1-6 cubiertos por los cambios descritos arriba.
