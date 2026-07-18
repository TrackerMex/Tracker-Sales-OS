# Tracker Sales OS — Status

**Última actualización**: 2026-07-17
**Features completadas**: 69/72 (`feature_list.json`)
**Pendientes**: features 64 (logging estructurado), 65 (backups de DB en prod), 66 (multi-tenancy)
**En producción**: sí

---

## Features recientes (esta sesión)

### Fix: la lámina ejecutiva no cargaba estilos en el popup (2026-07-17)

**Síntoma**: el botón "Abrir lámina" en `/reportes` abría la ventana con el slide como HTML crudo, sin estilos. La ruta `/lamina` nunca estuvo afectada.

**Causa raíz**: `openLamina()` (`ReportsPage.tsx`) clona `#executive-slide` a una ventana nueva vía `document.write`, y solo inyectaba un `<style>` inline pequeño. Funcionó mientras el slide llevaba props `style` inline — que viajan dentro del `outerHTML` — pero el commit `14645ee` (plan 004) migró sus 120 estilos inline a clases Tailwind, y el popup no tenía hoja de estilos para resolverlas.

**Fix** (commit `30b4bb7`, rama `fix/lamina-popup-styles`, 8 líneas en un archivo):
- Clona los `<link rel="stylesheet">` y `<style>` del documento padre al `<head>` del popup. Cubre dev (Vite inyecta `<style>`) y prod (`/assets/index-*.css`, mismo origen).
- Elimina el reset inline `*{margin:0;padding:0}`: **las reglas CSS sin capa ganan a las que están en capa sin importar especificidad**, así que ese reset pisaba todas las utilidades de espaciado de Tailwind (`@layer utilities`) y habría colapsado el padding del slide a cero — un bug más sutil que el original. El preflight de Tailwind, ya incluido en los estilos clonados, hace el mismo reset desde `@layer base`, donde las utilidades sí ganan. Las reglas de `body` y print se quedan sin capa a propósito: deben ganar sobre `index.css`.

**Verificado en navegador** (Docker dev, `/reportes` → "Abrir lámina"): 7 hojas clonadas; header navy `rgb(0,21,36)` con padding `22px 28px` idéntico a la fuente; verde `rgb(130,188,0)`; Montserrat cargada; body `#EEF2F7` padding `32px`; print (`emulateMedia`) deja body blanco, padding 0, sin radius ni sombra, navy conservado. `pnpm typecheck` y `pnpm lint` limpios. Detalle en `progress/impl_fix_lamina_popup_styles.md` (untracked, no entró al commit).

**Git**: push directo a `origin/main` rechazado — `main` tiene protección de rama y exige PR. La rama `fix/lamina-popup-styles` está pusheada; **PR pendiente de abrir** (`gh` no autenticado en la sesión): https://github.com/TrackerMex/Tracker-Sales-OS/pull/new/fix/lamina-popup-styles

### Cierre de la migración de iconos + consolidación visual mergeada a `main` (2026-07-16)

**Iconos unificados a 18px** (commit `4da041f`, 12 archivos, +79/-334):
- Se completó la migración a `reicon-react`: los últimos SVG inline hardcoded (`Header`, `AppSidebar`, `AgendaPage`) ahora usan componentes del wrapper.
- `createIcon` en `shared/components/Icon.tsx` aplica `size = 18` por defecto — el wrapper es dueño del tamaño, no cada call site. Se borraron los 15 `size={11..14}` explícitos.
- `components/ui/sidebar.tsx`: la regla base pasó de `size-5` a `size-[18px]` para que el CSS no gane sobre el default.
- Excepción deliberada: los iconos dentro de shadcn `Button` quedan en 16px por su propia regla `[&_svg]:size-4`.
- `.codex/` añadido a `.gitignore` (config local de agentes).

**Consolidación visual (planes 001–005): 5/5 DONE y mergeados a `main`** por fast-forward desde `review-ui`. Smoke visual de cierre ejecutado con Docker real — cierra los pendientes de los planes 001/003/004 (detalle en `plans/README.md`): 0 errores de consola en `/login`, `/dashboard`, `/reportes`, `/mi-dia` y `/coaching`; barras `scaleX` verificadas al 0% y al 100%; lámina ejecutiva con datos reales; tamaños de icono medidos en el DOM.

**Limpieza de worktrees**: se eliminaron los 8 worktrees de agente y sus 10 branches. Los 6 que tenían cambios sin commitear estaban basados en commits de hace 40+ días y su contenido **ya estaba en `main`** por otra vía (verificado: `CoachingPage` ya tiene `SellerCoachingCard`, `SalesPage` ya usa `dirProject` y no importa `SaleFormBase`; los 6 parches dan conflicto contra `main` porque el código evolucionó más allá). Los diffs quedaron respaldados sin trackear en `progress/stale-worktrees/` — borrables cuando se confirme que no hacen falta.

**Estado de git**: `main` está `ahead 31` de `origin/main`, con typecheck y build exit 0. **Sin pushear** — el push a `origin/main` dispara auto-deploy a producción vía Dokploy.

Nota: durante el merge se reconcilió una divergencia con `origin/main` (el merge commit de PR #21 `71-new-labals`, que no aportaba contenido nuevo); el árbol quedó idéntico.

Hallazgo anotado, fuera de alcance: en `/reportes` la Salud Comercial marca 100/100 mientras Focos Rojos reporta "volumen de actividad comercial muy bajo" — incoherencia preexistente del scoring.

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
