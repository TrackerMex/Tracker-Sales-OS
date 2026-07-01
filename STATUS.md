# Tracker Sales OS — Status

**Última actualización**: 2026-07-01
**Features completadas**: 40/40 + feature 41 (actividades enriquecidas) + feature 42 (Mi Día enriquecido) + feature 43 (Mi Día: confirmar completar)
**En producción**: sí

---

## Features recientes (esta sesión)

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
