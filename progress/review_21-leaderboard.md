# Review 21-leaderboard

**Resultado: 9/9 checkpoints PASSED, 0 FAILED.**
Verificación `tsc --noEmit`: backend exit 0, frontend exit 0.

---

## Checkpoint 1 — IActivityRepository suma puntos por seller/día (una query, excluye soft-deleted) — PASSED
`backend/src/modules/activities/infrastructure/repositories/activity.repository.impl.ts:84-104`
- UNA sola query (`createQueryBuilder(...).getRawMany()`), sin N+1.
- `GROUP BY activity.sellerId` + `addGroupBy(TO_CHAR(executedAt,'YYYY-MM-DD'))` — agrupa por seller + día.
- Excluye soft-deleted: `.andWhere('activity.deletedAt IS NULL')`.
- Filtra rango con `executedAt >= :from AND executedAt < :to` (límite superior exclusivo, correcto).
- Retorna `day` como string `YYYY-MM-DD` y `points: Number(...)`. Interface declarada en `activity.repository.interface.ts:10-13`.
- Caveat menor (no bloqueante): `TO_CHAR(executedAt, ...)` renderiza en el timezone de sesión de Postgres, mientras que el use-case construye claves de día con la hora local del proceso Node (`dayStr`/`monthPrefix`). Si DB y Node comparten TZ (caso típico Docker = UTC) son consistentes. Es el mismo patrón ya usado por `get-sellers-score`, por lo que es coherente con el codebase.

## Checkpoint 2 — LeaderboardRowDto con 7 campos — PASSED
`backend/src/modules/dashboard/application/dtos/leaderboard-row.dto.ts:1-9`
Campos exactos: `rank, sellerId, sellerName, monthlyPoints, previousMonthPoints, pointsDelta, streakDays`. Clase plana, consistente con `stalled-deal.dto.ts`.

## Checkpoint 3 — GetLeaderboardUseCase (puntos mes actual/anterior, delta, racha, orden DESC, rank) — PASSED
`backend/src/modules/dashboard/application/use-cases/get-leaderboard.use-case.ts`
- `monthlyPoints` (prefijo mes actual) y `previousMonthPoints` (prefijo mes anterior): líneas 57-62.
- `pointsDelta = monthlyPoints - previousMonthPoints`: línea 72.
- Racha con `dailyMinPoints` leído de Settings (`getSettings.execute()`, líneas 24-25).
- Orden `monthlyPoints` DESC y `rank` 1..N: líneas 77-80 (`Array.sort` estable en Node moderno).

## Checkpoint 4 — Incluye todos los sellers activos (0 puntos al final) — PASSED
`get-leaderboard.use-case.ts:27-29,54-75`
- `sellerRepo.find({ where: { active: true, deletedAt: IsNull() } })`.
- Todos los sellers se mapean; sin actividad → `monthlyPoints = 0`. Tras el sort DESC quedan al final.

## Checkpoint 5 — Racha: días consecutivos con gracia del día en curso — PASSED
`get-leaderboard.use-case.ts:98-123`
- Comparación correcta `>= dailyMinPoints` (`meets`).
- Gracia día en curso: si hoy no cumple pero ayer sí, arranca desde ayer; si tampoco ayer, devuelve 0 (líneas 112-115).
- Corta en el primer día que no cumple (condición del `while`, línea 118).
- Acotado a `lowerBound` (inicio mes anterior) — evita loop infinito si `dailyMinPoints === 0`.
- Claves de día consistentes con la query (mismo formato `YYYY-MM-DD`); ver caveat de TZ en checkpoint 1.

## Checkpoint 6 — GET /api/dashboard/leaderboard solo Admin/Director — PASSED
`backend/src/modules/dashboard/presentation/dashboard.controller.ts:62-67`
- `@Get('leaderboard')` + `@UseGuards(RolesGuard)` + `@Roles(UserRole.Admin, UserRole.Director)`.
- Guard de clase `@UseGuards(JwtAuthGuard)` (línea 17) aplica además autenticación. Mismo patrón ya aceptado en `stalled-deals`.
- Registrado en módulo: `dashboard.module.ts:19,33,43` (importa `ActivitiesModule` para el token `ACTIVITY_REPOSITORY`; sin ciclo).
- **Rango de fechas verificado**: `from = new Date(y, m-1, 1)` y `to = new Date(y, m, today+1)`. Edge enero→diciembre OK: `new Date(2026,-1,1)` = 1-dic-2025 y `monthPrefix` deriva el año del Date corregido ("2025-12"). Cubre mes anterior completo + mes actual hasta hoy (mañana exclusivo).

## Checkpoint 7 — Dashboard muestra "Leaderboard del mes" (rank, nombre, puntos, delta +/-, racha; solo Admin/Director) — PASSED
`frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx:239-267` (sección bajo `{isAdminOrDirector && ...}`, título "Leaderboard del mes", manejo de error con Reintentar).
`frontend/src/modules/dashboard/presentation/components/LeaderboardTable.tsx`
- Columnas: # (rank con badge top-3), Vendedor, Puntos mes, Delta, Racha.
- Delta con signo y color: verde `+` si >0, rojo si <0, muted `0` (líneas 15-19, 73-75).
- Racha mostrada como badge "N d" (líneas 76-82).
- Hook `useLeaderboard.ts` y `dashboardApi.getLeaderboard` + tipo `LeaderboardEntry` (7 campos) correctos.

## Checkpoint 8 — No se crean tablas nuevas — PASSED
- `git status` solo muestra archivos esperados; los 2 archivos nuevos backend son DTO y use-case (sin `@Entity`). No hay archivos `*.migration.ts` en el repo.
- El use-case solo lee sobre `activities` + `sellers` (entidades existentes).

## Checkpoint 9 — tsc --noEmit sin errores — PASSED
- Backend (`backend/`, `npx tsc --noEmit`): exit 0.
- Frontend (`frontend/`, `npx tsc --noEmit`): exit 0.

---

## Nota sobre el test (spec mock)
`backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts:16`
- Se añadió SOLO la línea `sumPointsByDayForSellers: jest.fn()` al factory `makeMockRepo` (mismo patrón que `findStalledDeals: jest.fn()` de la feature 20, línea 30 del mock de dealRepo).
- No altera ninguna assertion ni lógica de test; es un stub mecánico necesario para que el mock satisfaga el interface extendido y compile.

## Conclusión
Feature **21-leaderboard** cumple los 9 checkpoints. Lista para marcar como `done`. Único punto de atención (no bloqueante, heredado del patrón existente): consistencia de timezone entre el `TO_CHAR` de Postgres y la hora local de Node para las claves de día.
