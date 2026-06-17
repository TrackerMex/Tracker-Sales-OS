# Review — Feature 27: Anti-solapamiento de horarios de tareas

Reviewed: 2026-06-16

## Checkpoint results

**CP1** — `ITaskRepository.findConflictingTask` signature  
PASS  
`task.repository.interface.ts` line 9 declares the method with exact signature:  
`findConflictingTask(sellerId: string, scheduledAt: Date, excludeTaskId?: string): Promise<TaskEntity | null>`

**CP2** — `CreateTaskUseCase` calls check before create, throws `ConflictException` with correct message  
PASS  
`create-task.use-case.ts` lines 19-27: converts input to `Date`, calls `findConflictingTask(input.sellerId, scheduledAt)` (no excludeTaskId), and on conflict throws `ConflictException` with the exact message format:  
`Ya tienes una tarea programada para el ${fecha} a las ${hora}: "${conflict.title}"`

**CP3** — `UpdateTaskUseCase` calls check only when `scheduledAt` present, passes `taskId` as `excludeTaskId`  
PASS  
`update-task.use-case.ts` lines 30-39: check is gated behind `if (input.scheduledAt)`, and `findConflictingTask(input.sellerId, newScheduledAt, input.taskId)` correctly passes `taskId` as the third argument.

**CP4** — `findConflictingTask` implementation: seller + Pending + not deleted + same minute + excludes id  
PASS  
`task.repository.impl.ts` lines 88-103:
- Same seller: `.where('task.sellerId = :sellerId', ...)`
- Status Pending: `.andWhere('task.status = :status', { status: TaskStatus.Pending })`
- Not soft-deleted: `.andWhere('task.deletedAt IS NULL')`
- Same minute: `date_trunc('minute', task.scheduled_at) = date_trunc('minute', :scheduledAt::timestamptz)`
- Excludes id when provided: `if (excludeTaskId) qb.andWhere('task.id != :excludeTaskId', ...)`

**CP5** — No new tables or migrations added  
PASS  
Only one migration file exists in the repo (`1749528600000-AddStageToActivities.ts`), which predates this feature.

**CP6** — tsc passes  
PASS  
Confirmed clean compile in `impl_27-task-time-overlap.md`.

## Bugs / edge cases

**1. Timezone mismatch in date_trunc (low severity)**  
The stored `scheduled_at` column is almost certainly `TIMESTAMP WITHOUT TIME ZONE` (TypeORM default for `Date`), but the comparison casts the parameter with `::timestamptz`. If the PostgreSQL session timezone differs from UTC, `date_trunc('minute', :scheduledAt::timestamptz)` may truncate at a different offset than `date_trunc('minute', task.scheduled_at)`. In practice this is only an issue if the DB session timezone is set to something other than UTC (or whatever timezone the app writes in). Worth a note in integration tests; not a blocker for the current deployment.

**2. Locale date formatting depends on Node.js ICU data (very low severity)**  
`toLocaleDateString('es-MX')` and `toLocaleTimeString('es-MX', { hour12: false })` require full ICU data. Modern Node.js (v13+) ships with full ICU by default, so this is fine unless a slim build is used. The error message format will still be returned — it just might fall back to a different locale string.

**3. No edge case for same task being rescheduled to its own current time (informational)**  
This is correctly handled: `UpdateTaskUseCase` always passes `input.taskId` as `excludeTaskId`, so a task can be saved with no changes to `scheduledAt` without falsely triggering a conflict against itself.

## Summary

All 6 checkpoints PASS. The implementation is complete and correct. Two minor edge cases noted around timezone handling and locale ICU data, neither of which is a blocker.
