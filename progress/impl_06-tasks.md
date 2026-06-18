# Implementation: 06-tasks (Tasks & Agenda)

## Files created / modified

### Backend — `backend/src/modules/tasks/`

**Modified:**
- `domain/entities/task.entity.ts` — rewrote with TaskStatus enum and correct fields (title, description, status, clientId nullable)
- `domain/repositories/task.repository.interface.ts` — updated signature: `findTodayBySeller(sellerId, date)` + `findOverdueBySeller(sellerId)`
- `presentation/tasks.controller.ts` — full implementation with JwtAuthGuard, RolesGuard, Roles decorators + 3 use cases
- `tasks.module.ts` — wired TypeOrmModule, AuthModule, repository provider, 3 use cases

**Created:**
- `application/dtos/create-task.dto.ts`
- `application/dtos/task.dto.ts` (with `isOverdue` computed field)
- `application/use-cases/create-task.use-case.ts`
- `application/use-cases/get-today-tasks.use-case.ts`
- `application/use-cases/complete-task.use-case.ts`
- `infrastructure/entities/task.typeorm.entity.ts` (table: tasks, snake_case columns, soft delete)
- `infrastructure/repositories/task.repository.impl.ts`

### Frontend — `frontend/src/modules/tasks/`

**Modified:**
- `domain/tasks.types.ts` — rewrote with correct Task interface (isOverdue, status as union type)
- `routes/_app/agenda.tsx` — replaced placeholder with AgendaPage import

**Created:**
- `infrastructure/tasks.api.ts`
- `application/hooks/useTodayTasks.ts`
- `application/hooks/useCreateTask.ts`
- `application/hooks/useCompleteTask.ts`
- `presentation/components/TaskCard.tsx`
- `presentation/components/CreateTaskForm.tsx`
- `presentation/pages/AgendaPage.tsx`

## Design decisions

- `app.module.ts` already had `TasksModule` imported — left untouched
- `findTodayBySeller` uses local `setHours` (not UTC) to match the seller's day — consistent with how activities uses setUTCHours but appropriate for local scheduling
- Route file keeps `createRoute` + `appLayoutRoute` pattern (not `createFileRoute`) since the project doesn't use TanStack file-based routing
- `AgendaPage` navigates to `/actividades/nueva` after completing a task (optional `clientId` in search params)
- axios import uses named export `{ api }` as per the project's `axios.ts`

## tsc --noEmit result

- Backend: PASS (no errors)
- Frontend: PASS (no errors)

---

## Fix: TS6133 en AgendaPage.tsx (2026-06-18)

Se ha resuelto el error de TypeScript `TS6133: 'handleSelectedDateChange' is declared but its value is never read` en `AgendaPage.tsx`.

### Cambios realizados

- **CalendarView.tsx**:
    - Se agregó `onSelectedDateChange?: (date: Date) => void` a la interfaz `CalendarViewProps`.
    - Se actualizó el componente `CalendarView` para invocar este callback cuando cambia la fecha seleccionada internamente (en los métodos `handlePrevWeek`, `handleNextWeek`, `handlePrevDay`, `handleNextDay` y al hacer clic en un día del mes).
- **AgendaPage.tsx**:
    - Se vinculó la función `handleSelectedDateChange` al prop `onSelectedDateChange` del componente `CalendarView`.

### Verificación

- Se ejecutó `npx tsc --noEmit -p frontend/tsconfig.json` y no se reportaron errores.
- El error de diagnóstico `TS6133` en `AgendaPage.tsx` ha sido resuelto.
