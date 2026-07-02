# Tracker Sales OS — Status

**Última actualización**: 2026-07-02
**Features completadas**: 47/47 (hasta feature 47 inclusive)
**Pendiente registrada (no implementada)**: feature 48 — combobox buscable de selección de cliente
**En producción**: sí

---

## Features recientes (esta sesión)

### Auditoría de bugs 2026-07-01 → 3 fixes (features 45, 46, 47)

Origen: el usuario pidió analizar el proyecto en busca de bugs. Hallazgos en `progress/explore_bugs_2026-07-01.md` (7 bugs, B1-B7). Se ejecutaron 3 fixes en orden, cada uno con flujo completo Implementer+Reviewer (excepto 46, infra fuera de `modules/`, ejecutado directo por el Líder):

**Feature 45 — Autorización por JWT en tasks/activities (B1 ALTA + B3 MEDIA + B4 MEDIA)**
- Ownership de tareas (complete/update/reactivate/delete) era spoofable vía `@Body('sellerId')`. Ahora deriva de `req.user` (JWT); Admin/Director bypass, Seller restringido a lo propio.
- `POST /tasks` y `POST /activities` fuerzan `sellerId` del JWT para role Seller.
- `PATCH /activities/:id/status` valida ownership (404/403).
- Review 13/13 PASS. Commit `b3791e4`.

**Feature 46 — Reconciliación de schema y migraciones (B2 ALTA)**
- Hallazgo grave: tabla `migrations` en dev vacía — todo el schema (incl. `activities.task_id/contact_id`, `tasks.type/contact_id`) existía solo vía `TYPEORM_SYNCHRONIZE=true`, nunca por migración. `app.module.ts` ignoraba `TYPEORM_MIGRATIONS_RUN` (hardcoded false).
- Hay prod real con datos, sin acceso directo — todas las migraciones (baseline nueva + 4 legacy retrofitteadas) son **idempotentes** (`IF NOT EXISTS` / `DO $$ ... EXCEPTION WHEN duplicate_object`).
- Verificado E2E: volumen dev recreado vacío → 5 migraciones aplican limpio → re-run idempotente confirmado → schema idéntico al original + fix colateral de `timestamptz` drift.
- **Antes de deploy a prod: hacer backup primero** (migraciones idempotentes pero sin forma de confirmar estado real de esa DB).
- Review 11/11 PASS. Commit `c0586d7`.

**Feature 47 — Hardening menor (B6 BAJA + B7 BAJA)**
- `TaskRepositoryImpl.update()`/`ActivityRepositoryImpl.update()` lanzan `NotFoundException` en vez de crashear con id inexistente (defensivo, sin cambio de comportamiento actual).
- Backend enriquece `TaskDto` con `clientName`/`contactName` (leftJoin, sin N+1); frontend (`AgendaPage`, `CalendarView`, `MiDiaPage`) deja de resolver nombres cargando 200 clientes en memoria.
- Review 16/16 PASS. Pendiente de commit por el usuario.

**Feature 48 registrada (pending, no implementada)**: combobox buscable server-side para el selector de cliente en 4 formularios (`CreateTaskForm`, `EditTaskForm`, `ActivityForm`, `SalesPage`), reemplaza `useClients({limit:100-200})`. Backend ya soporta `q`/`page`/`limit`. Decisión: enfoque shadcn Command+Popover (dependencia npm `cmdk` nueva, pedir aprobación antes de instalar).

### Feature 44 — Eliminar tarea
- Soft-delete de tareas desde Agenda (`TaskCard`), mismo patrón de ownership/confirmación que el resto de acciones.

---

## Sesión anterior (2026-07-01, antes de la auditoría)

### Feature 43 — Mi Día: confirmación y feedback al completar tarea

- Botón "Completar" ahora pide confirmación (`AlertDialog`, mismo texto que Agenda) antes de ejecutar
- `toast.success`/`toast.error` + navega a `/actividades/nueva` con clientId/taskTitle/taskId tras completar
- Solo frontend, sin cambios backend

### Feature 42 — Mi Día: cliente, contacto y tipo de actividad en el listado de tareas

- `TaskCard.tsx`: `TYPE_TAG` exportado (antes privado)
- `MiDiaPage.tsx`: cada tarea de "Agenda de hoy y pendientes" muestra nombre de cliente, contacto y badge de tipo (mismo patrón de resolución que `AgendaPage.tsx` vía `useClients`)
- Solo frontend, sin cambios backend. Sin botones nuevos (Editar/Reactivar) — botón "Completar" intacto

### Feature 41 — Lista de actividades: cliente, contacto y tarea vinculada

**Backend:**
- `ActivityEntity` — campos opcionales: `clientName`, `contactName`, `taskTitle`
- `ActivityRepositoryImpl.findDailyBySeller` — QueryBuilder con LEFT JOIN a `clients`, `contacts`, `tasks` via `getRawAndEntities()`
- `ActivityDto` — expone `clientName`, `contactName`, `taskTitle`

**Frontend:**
- `Activity` type — 3 campos opcionales añadidos
- `ActivitiesPage` — cada card muestra:
  - `[OfficeIcon] Nombre empresa` (navy #002B49, bold)
  - `[User02Icon] Nombre contacto` (slate #475569)
  - `[CheckListIcon] Título tarea` (pill índigo #EEF2FF/#3730A3)

---

## Features anteriores

### Feature 39 — Calendario equipo (Admin/Director)
- `GET /api/tasks/team` (Admin/Director only)
- Selector "Todos los vendedores" en vista Calendario de Agenda
- Chips muestran nombre del vendedor en modo equipo

### Feature 40 — Compartir reporte como hipervínculo
- Botón "Compartir" en Reportes genera link a `/lamina?month=...&goalAmount=...`
- Ruta `/lamina` standalone (sin sidebar/nav) muestra solo ExecutiveSlide
- Auth: redirect a `/login?redirect=...` → post-login regresa al link original

### Fix: migración sessionStorage → localStorage (auth)
- `app.store.ts`, `axios.ts`, `index.tsx`, `dashboard.tsx`, `_app.tsx`
- Token persiste entre tabs y links externos
- `router.history.push(redirect)` para URLs con query params

---

## Stack en producción
- Backend: NestJS 11 + TypeORM + PostgreSQL
- Frontend: React 19 + TanStack Router/Query + Zustand + Tailwind v4
- Infra: Docker Compose (postgres + api + ui + nginx)
