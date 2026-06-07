# History — Tracker Sales OS

## 2026-06-07 — 09-dashboard

**Status**: done

**Archivos creados:**
- Backend (8): dashboard-summary.dto.ts, seller-score.dto.ts, overdue-task.dto.ts, get-dashboard-summary.use-case.ts, get-sellers-score.use-case.ts, get-overdue-tasks.use-case.ts, dashboard.controller.ts (reemplazado), dashboard.module.ts (reemplazado)
- Frontend (10): dashboard.types.ts, dashboard.api.ts, useDashboardSummary.ts, useSellersSemaphore.ts, useOverdueTasks.ts, KPICard.tsx, SellerSemaphoreTable.tsx, OverdueTasksList.tsx, DashboardPage.tsx, routes/_app/dashboard.tsx (reemplazado)

**CHECKPOINT**: PASSED — 5/5 criterios

**Decisiones clave:**
- Dashboard usa TypeOrmModule.forFeature directo (no importa módulos ajenos) — módulo de lectura agregada
- Score formula: 45×esfuerzo + 35×calidad + 40×volumen - 10×vencidos, clamped [0,100]
- volumen = monthlyPoints (puntos del mes) / 50 — no sales units
- GetOverdueTasks filtra por sellers activos (no expone tareas de sellers inactivos)

## 2026-06-07 — 08-sales

**Status**: done

**Archivos creados:**
- Backend (8): sale.repository.interface.ts, create-sale.dto.ts, sale-filters.dto.ts, sale-response.dto.ts, create-sale.use-case.ts, get-sales.use-case.ts, sale.typeorm.entity.ts, sale.repository.impl.ts
- Backend (2 reemplazados): sales.controller.ts, sales.module.ts
- Frontend (4 nuevos): sales.api.ts, useCreateSale.ts, useSales.ts, SaleFormBase.tsx, SalesPage.tsx
- Frontend (2 modificados): sales.types.ts, routes/_app/ventas.tsx

**CHECKPOINT**: PASSED — 4/4 criterios

**Decisiones clave:**
- SaleFormBase compartido entre los 3 tabs, recibe `type` como prop
- `computeSummary` en GetSalesUseCase acumula Nuevo/Existente en buckets separados
- `GetSalesInput`/`GetSalesOutput` exportadas para evitar TS4053
- PaymentMethod del scaffold: Pagado | Crédito | 50% anticipo | Pendiente (difiere de architecture.md)

**tsc --noEmit**: PASS backend y frontend

---

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
