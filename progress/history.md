# History — Tracker Sales OS

## 2026-06-07 — 07-pipeline

**Status**: done

**Archivos creados (17):**
- Backend (9): deal.typeorm.entity.ts, deal.repository.impl.ts, audit.interceptor.ts, create-deal.dto.ts, change-stage.dto.ts, deal.dto.ts, create-deal.use-case.ts, get-pipeline-by-seller.use-case.ts, change-deal-stage.use-case.ts
- Backend (2 modificados): pipeline.controller.ts, pipeline.module.ts
- Frontend (8): pipeline.types.ts (actualizado), pipeline.api.ts, usePipeline.ts, useCreateDeal.ts, useChangeStage.ts, DealCard.tsx, KanbanColumn.tsx, PipelinePage.tsx
- Frontend (1 modificado): routes/_app/pipeline.tsx

**CHECKPOINT**: PASSED — 6/6 criterios

**Decisiones clave:**
- AuditInterceptor deriva `oldStage` del penúltimo entry de `stageHistory` en el response (no hace query a DB)
- Kanban click-based (select + botón Mover) — sin DnD library instalada
- `getPipelineBySeller` retorna todos los 7 stages inicializados aunque estén vacíos
- `amount` en TypeORM como `decimal` con `Number()` cast en toDomain()
- `ALLOWED_TRANSITIONS` definido en domain/entities y re-usado en frontend DealCard

**tsc --noEmit**: PASS backend y frontend

---

## 2026-06-07 — 06-tasks

**Status**: done

**Archivos creados/modificados:**
- Backend: task.entity.ts, task.repository.interface.ts, create-task.dto.ts, task.dto.ts (con isOverdue calculado), create-task.use-case.ts, get-today-tasks.use-case.ts, complete-task.use-case.ts, task.typeorm.entity.ts, task.repository.impl.ts, tasks.controller.ts, tasks.module.ts
- Frontend: tasks.types.ts, tasks.api.ts, useTodayTasks.ts, useCreateTask.ts, useCompleteTask.ts, TaskCard.tsx, CreateTaskForm.tsx, AgendaPage.tsx, routes/_app/agenda.tsx

**Decisiones clave:**
- `isOverdue` se calcula en TaskDto.fromEntity() (no se persiste en DB)
- CompleteTask lanza ForbiddenException si task.sellerId !== input.sellerId
- Completar tarea navega a /actividades/nueva con clientId en search params
- DB: synchronize:true, sin migrations

**tsc --noEmit**: PASS backend y frontend

---

## 2026-06-06 — 05-activities

**Status**: done

**Archivos creados (18):**
- Backend (9 nuevos): DTOs (create, response, query), use-cases (create, get-daily, get-seller), TypeORM entity, repository impl, tests unitarios
- Backend (2 reemplazados): activities.controller.ts, activities.module.ts
- Frontend (5 nuevos): activities.api.ts, useCreateActivity, useDailyActivities, ActivityForm.tsx, ActivitiesPage.tsx
- Frontend (2 actualizados): activities.types.ts, actividades.nueva.tsx (ruta)

**CHECKPOINT**: PASSED — 8/8 criterios

**Decisiones clave:**
- `findDailyBySeller` usa rango UTC explícito (setUTCHours) en vez de DATE() en SQL raw
- `GetDailyInput/GetDailyOutput` interfaces exportadas para evitar error TS4053
- `Roles` decorator real en `presentation/decorators/` (no `infrastructure/decorators/`)
