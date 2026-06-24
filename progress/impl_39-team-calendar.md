# Feature 39 — Admin/Director team calendar view

## Files modified

### Backend
- `backend/src/modules/tasks/domain/repositories/task.repository.interface.ts` — added `findMonthAllSellers(dateFrom: Date): Promise<TaskEntity[]>`
- `backend/src/modules/tasks/infrastructure/repositories/task.repository.impl.ts` — implemented `findMonthAllSellers` (no sellerId filter, queries from dateFrom onward)
- `backend/src/modules/tasks/application/use-cases/get-team-tasks.use-case.ts` — created; calls `findMonthAllSellers`
- `backend/src/modules/tasks/presentation/tasks.controller.ts` — added `GET /tasks/team` endpoint (Admin/Director only) before `seller/:id/today` to avoid route conflicts; added `GetTeamTasksUseCase` to constructor
- `backend/src/modules/tasks/tasks.module.ts` — imported and registered `GetTeamTasksUseCase` in providers

### Frontend
- `frontend/src/modules/tasks/domain/tasks.types.ts` — added optional `sellerName?: string` to `Task`
- `frontend/src/modules/tasks/infrastructure/tasks.api.ts` — added `getMonthTeamTasks(monthStart)`
- `frontend/src/modules/tasks/application/hooks/useTeamMonthTasks.ts` — created; accepts `enabled` param; disabled by default for Seller role
- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx` — `TaskChip` chipLabel includes `task.sellerName`; HoverCard shows seller name badge when present
- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx` — added seller dropdown (only in calendar view for Admin/Director); both `useMonthTasks` and `useTeamMonthTasks` always called; `isTeamMode` flag picks which dataset to pass to `CalendarView`; seller names enriched from `useSellers()` map

## Key decisions
- `GET /tasks/team` is placed before `GET /tasks/seller/:id/today` to avoid NestJS treating "team" as a dynamic `:id` segment
- Both month hooks always run (React rules); `useTeamMonthTasks` uses `enabled` prop so Seller role never hits the guarded endpoint
- Seller name enrichment is done on the frontend using the existing `useSellers()` hook (sellers already loaded for Admin/Director equipo page)
- `selectedSeller` state persisted in localStorage under `tasks_team_seller_filter`; currently only "all" mode is fully wired (per-seller filter inside calendar is left for a follow-up if needed)

## tsc results
- backend: exit 0, no errors
- frontend: exit 0, no errors
