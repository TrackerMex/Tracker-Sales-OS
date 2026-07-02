# impl_46-schema-migrations-reconcile

Ejecutado directamente por el Líder (no delegado a Implementer) — el alcance cae fuera de `backend/src/modules/`/`frontend/src/modules/` (migraciones, `data-source.ts`, `app.module.ts`) y requería iteración estrecha con Docker/DB que no tenía sentido delegar en frío.

## Diagnóstico (por qué B2 era más grave de lo reportado)

Al investigar, la tabla `migrations` en la DB dev estaba **vacía** (0 filas) pese a existir 4 archivos de migración en `backend/src/migrations/`. Confirmó que ninguna de esas 4 migraciones corrió nunca ahí — todo el schema (incluyendo `activities.task_id`, `activities.contact_id`, `tasks.type`, `tasks.contact_id`, `activities.stage/status/activity_history`, `deals.opportunity_name`) se creó vía `TYPEORM_SYNCHRONIZE=true` en algún punto anterior del desarrollo.

Además:
- `app.module.ts` ignoraba `TYPEORM_MIGRATIONS_RUN` del env — estaba hardcoded a `false` (explica por qué el historial de commits alternó `migrationsRun` on/off sin efecto real).
- No existían scripts npm para invocar el CLI de TypeORM (aunque `backend/src/data-source.ts` ya existía, sin uso).
- El usuario confirmó que existe una DB de producción real con datos, **sin acceso directo** para introspectarla. Esto descartó cualquier enfoque que asumiera el estado de prod (p.ej. migraciones plain `ADD COLUMN` que fallarían si la columna ya existe ahí).

## Decisión de diseño: migraciones 100% idempotentes

Dado que no hay visibilidad de prod, todas las migraciones (la nueva baseline + las 4 legacy retrofitteadas) usan primitivas seguras de re-ejecutar sin importar el estado real del entorno:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `ALTER TABLE ... DROP COLUMN IF EXISTS` (en los `down()`)
- `DO $$ BEGIN <statement>; EXCEPTION WHEN duplicate_object THEN null; END $$;` para `CREATE TYPE ... AS ENUM` y `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` (Postgres no soporta `IF NOT EXISTS` nativo para tipos ni constraints)
- `DROP TABLE IF EXISTS` / `DROP TYPE IF EXISTS` / `ALTER TABLE ... DROP CONSTRAINT IF EXISTS` en downs

## Archivos nuevos/modificados

- `backend/src/migrations/1749000000000-BaselineSchemaReconcile.ts` (nuevo) — generado con `migration:generate` contra una DB Postgres vacía real (no escrito a mano), captura las 10 entidades + `audit_logs` (11 tablas). Timestamp deliberadamente menor que las 4 migraciones legacy para correr primero.
- `backend/src/migrations/1749528600000-AddStageToActivities.ts` — `ADD COLUMN`/`DROP COLUMN` con guards.
- `backend/src/migrations/1750386000000-AddStatusAndActivityHistoryToActivities.ts` — ídem, 2 columnas.
- `backend/src/migrations/1750400000000-AddOpportunityNameToDeals.ts` — reescrito de `queryRunner.addColumn(TableColumn)` (sin soporte IF NOT EXISTS) a SQL raw idempotente.
- `backend/src/migrations/1782259200000-AlterTaskTitleToText.ts` — sin cambios (ALTER COLUMN TYPE ya es idempotente por naturaleza).
- `backend/package.json` — scripts `typeorm`, `migration:generate`, `migration:run`, `migration:revert`.
- `backend/src/app.module.ts` — `migrationsRun` ahora lee `TYPEORM_MIGRATIONS_RUN` del env (antes hardcoded `false`).
- `.env` (raíz, gitignored) — `TYPEORM_MIGRATIONS_RUN` de `false` a `true` para que dev ejercite el mismo camino que prod.
- `docs/verification.md` — sección nueva "Migraciones TypeORM" con el flujo de CLI y la regla de "toda entidad nueva requiere su migración idempotente en el mismo PR".
- `docs/conventions.md` — corrige el path real de migraciones (era `backend/src/database/migrations/`, es `backend/src/migrations/`).

## Verificación E2E realizada

1. Usuario autorizó recrear el volumen docker de postgres local (datos de prueba, desechables): `docker compose down -v postgres && docker compose up -d postgres`.
2. `npx typeorm-ts-node-commonjs -d src/data-source.ts migration:generate src/migrations/...` contra la DB vacía → migración baseline generada automáticamente (no a mano) con el schema real y correcto de las entidades actuales.
3. Renombrado + patcheo manual de idempotencia (CLI no genera guards por defecto).
4. `migration:run` contra la DB vacía → las 5 migraciones corren sin error.
5. `migration:run` de nuevo → "No migrations are pending" (idempotencia confirmada, sin duplicados ni errores).
6. Comparación de schema resultante (`\dt`, `\d activities`, `\d tasks`, `\d deals`) contra la captura original pre-recreate → **idéntico** en las 11 tablas, mismas columnas/índices/FKs. Bonus: `created_at`/`updated_at`/`deleted_at` en `activities`/`tasks` quedaron correctamente como `timestamptz` (el dev DB original tenía drift a `timestamp without time zone` porque `synchronize` nunca las había alterado retroactivamente).
7. `.env` raíz: `TYPEORM_MIGRATIONS_RUN=false → true`. Reinicio de `tracker-sales-api` → boot limpio, `Nest application successfully started`, sin errores.
8. Smoke E2E: `POST /api/auth/login` con el admin auto-seedeado (`SeedUseCase`, `admin` / `Admin123!`) devuelve JWT válido.
9. `cd backend && npx tsc --noEmit` → exit 0.

## Hallazgos colaterales (fuera de alcance, documentados)

- `progress/seed_test_users.sql` está desactualizado: usa la columna `password` (el schema real es `password_hash`), por lo que la mayoría de sus INSERTs fallan silenciosamente contra la DB actual. No es parte de este fix; queda como nota para quien lo use en QA manual.
- El drift de `timestamp without time zone` → `timestamptz` en `created_at`/`updated_at`/`deleted_at` de `activities`/`tasks` en el dev DB original quedó corregido como efecto secundario de generar la baseline desde las entidades (que sí declaran `timestamptz`).

## Reviewer

Delegado a un Reviewer independiente (mismo rigor que feature 45) para auditar idempotencia, orden de timestamps, ausencia de cambios en `modules/`, y repetir la verificación E2E de forma independiente.
