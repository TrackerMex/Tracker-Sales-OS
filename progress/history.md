# History — Tracker Sales OS

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
