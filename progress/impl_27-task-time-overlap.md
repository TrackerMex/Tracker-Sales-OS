# Feature 27 — Anti-solapamiento de horarios de tareas

## Status: done

## Files modified

1. `backend/src/modules/tasks/domain/repositories/task.repository.interface.ts`
   - Added `findConflictingTask(sellerId, scheduledAt, excludeTaskId?)` to `ITaskRepository`

2. `backend/src/modules/tasks/infrastructure/repositories/task.repository.impl.ts`
   - Implemented `findConflictingTask`: QueryBuilder matching same seller, status=Pendiente, not soft-deleted, same minute via `date_trunc`

3. `backend/src/modules/tasks/application/use-cases/create-task.use-case.ts`
   - Extracted `scheduledAt` variable, added conflict check before `taskRepo.create`
   - Throws `ConflictException` with Spanish message including date, time, and conflicting task title

4. `backend/src/modules/tasks/application/use-cases/update-task.use-case.ts`
   - Added conflict check inside `if (input.scheduledAt)` guard, excluding the task being updated
   - Throws `ConflictException` with same message format

## tsc result

No TypeScript errors. Clean compile.
