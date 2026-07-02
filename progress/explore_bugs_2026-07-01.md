# Exploración: auditoría de bugs — 2026-07-01

Auditoría del Líder sobre código reciente (commits 01b892f, c639228) + módulos backend tasks/activities.

## Hallazgos

### B1 — ALTA (seguridad): ownership de tareas vía `@Body('sellerId')` — spoofable
- **Archivos**: `backend/src/modules/tasks/presentation/tasks.controller.ts:75,84,93,100`
- Los endpoints PATCH `:id/complete`, PATCH `:id`, PATCH `:id/reactivate`, DELETE `:id` toman `sellerId` del **body del request**, no del JWT.
- Impacto doble:
  1. Cualquier Seller puede completar/editar/reactivar/eliminar tareas de OTRO seller enviando el sellerId ajeno en el body (IDOR).
  2. Admin/Director NO pueden operar tareas ajenas legítimamente: el frontend manda su propio id (`useDeleteTask.ts:11` → `currentUser?.sellerId ?? currentUser?.id`) y el use-case responde 403.
- **Fix**: derivar sellerId de `req.user.sellerId` (JWT ya lo trae); en use-cases permitir bypass de ownership para Admin/Director. Quitar `sellerId` de los bodies en `tasks.api.ts` y hooks.

### B2 — ALTA (infra): drift de schema — migraciones incompletas + `migrationsRun: false`
- **Archivos**: `backend/src/app.module.ts:37`, `backend/src/migrations/` (solo 4 migraciones)
- Columnas `activities.task_id` y `activities.contact_id` NO tienen migración — se crearon vía `TYPEORM_SYNCHRONIZE=true` en dev (ver `progress/impl_37-*.md:51`). Igual riesgo con cambios posteriores.
- `migrationsRun: false` hardcoded. Historial de commits alternando on/off (db70e4b, dbfb8c5, d8b6ef8, c5f2205) confirma schema desincronizado.
- Deploy limpio con `TYPEORM_SYNCHRONIZE=false` (prod, `.env.prod.example`) → crash en `findDailyBySeller` (join a `activity.task_id`) y en todo lo que use esas columnas.
- **Fix**: generar migración(es) de reconciliación (task_id, contact_id y cualquier otra col faltante vs schema real), reactivar `migrationsRun: true` (o `migration:run` en entrypoint), documentar en docs/verification.md.

### B3 — MEDIA (seguridad): activities sin check de ownership en lectura/status
- **Archivo**: `backend/src/modules/activities/presentation/activities.controller.ts:70-102`
- `PATCH /activities/:id/status`: cualquier Seller cambia el status de actividades de otro (no valida que activity.sellerId == req.user.sellerId).
- `GET /activities/:id` y `GET /activities/client/:clientId`: Seller puede leer actividades ajenas.
- **Fix**: cargar activity y validar sellerId cuando role == Seller (mismo patrón que `getDailyPoints:50`).

### B4 — MEDIA (seguridad): POST /tasks y POST /activities aceptan sellerId arbitrario
- **Archivos**: `backend/src/modules/tasks/application/dtos/create-task.dto.ts:12`, `create-activity.dto.ts` (mismo patrón), controllers `create()` sin validación
- Seller puede crear tareas/actividades a nombre de otro seller (infla puntos/score ajeno o propio vía terceros).
- **Fix**: si role == Seller, forzar `dto.sellerId = req.user.sellerId`. Admin/Director sí pueden especificar.

### B5 — BAJA (correctitud): manejo de TZ inconsistente entre tasks y activities
- `task.repository.impl.ts:58,75` usa `setHours` (TZ local del proceso Node); `activity.repository.impl.ts:67,97` usa `setUTCHours`.
- "Hoy" difiere entre módulos si el server no corre en UTC → tareas del día vs puntos del día desalineados cerca de medianoche. Caveat conocido (features 21/23) pero ahora hay mezcla dentro del mismo dominio de fecha.
- **Fix**: unificar criterio (helper compartido en core) — decisión de diseño, no urgente.

### B6 — BAJA (robustez): `update()` con non-null assertion
- `task.repository.impl.ts:45-50`, `activity.repository.impl.ts:48-56`: `Object.assign(existing!, ...)` — id inexistente/borrado → TypeError 500 en vez de 404. Use-cases actuales hacen findById antes (mitigado), pero race condition posible.
- **Fix**: throw NotFoundException si `!existing`.

### B7 — BAJA (UX/datos): resolución de cliente/contacto con `useClients({ limit: 200 })`
- `MiDiaPage.tsx`, `AgendaPage.tsx`, `CreateTaskForm.tsx`: con >200 clientes, nombres dejan de resolverse silenciosamente.
- **Fix futuro**: backend ya enriquece `clientName/contactName` en activities (`findDailyBySeller`); replicar en tasks DTO y quitar lookup client-side.

## No encontrados (verificado OK)
- TaskStatus 'Completado' consistente frontend/backend.
- Soft-delete: QueryBuilder de TypeORM excluye deleted por default; filtros explícitos redundantes pero inofensivos.
- Casts `::text` en joins contact_id/task_id: correctos dado que las columnas son varchar.
- bugs.md previo: todos cerrados o resueltos (AI Coach implementado en feature 12/26).
