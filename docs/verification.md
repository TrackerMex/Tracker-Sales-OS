# Verificación — Tracker Sales OS

## Pipeline CI

El workflow `.github/workflows/ci.yml` se ejecuta en cada pull request y en cada push a `main`. Usa Node.js 22, `pnpm install --frozen-lockfile` y cache pnpm independiente para los lockfiles de `backend/` y `frontend/`.

**pnpm es el único gestor del proyecto.** `pnpm-lock.yaml` es la fuente de verdad: es el lockfile que consumen los Dockerfiles de dev y de producción, y el que valida CI. La versión está fijada con el campo `packageManager` de cada `package.json` y con `corepack prepare` en los Dockerfiles. No usar `npm install` ni `bun install`: generan lockfiles paralelos que divergen del árbol que se despliega.

Los jobs se publican como checks separados:

- `Backend`: TypeScript, ESLint en modo read-only y tests unitarios Jest con ejecución serial. La configuración Jest del backend usa `rootDir: src`, por lo que no descubre los E2E de `backend/test/`.
- `Frontend`: TypeScript, ESLint y build de producción.

Para bloquear merges cuando un job falla, un administrador del repositorio debe configurar en GitHub una branch protection rule o ruleset para `main` y marcar `Backend` y `Frontend` como required status checks. Esta configuración vive en GitHub y no queda habilitada únicamente por agregar el workflow al repositorio.

### Reproducir los checks localmente

```bash
cd backend
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm exec eslint "{src,apps,libs,test}/**/*.ts"
pnpm test --runInBand

cd ../frontend
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run build
```

Nota: en pnpm los flags se pasan sin `--` separador (`pnpm test --runInBand`); con `pnpm test -- --runInBand` Jest recibe `--runInBand` como pattern de archivos y no encuentra tests.

## Comandos por entorno

### Backend
```bash
cd backend

# Iniciar en dev (watch mode)
pnpm start:dev

# Verificar TypeScript
pnpm tsc --noEmit

# Tests unitarios
pnpm test

# Tests con coverage
pnpm test:cov

# Tests e2e
pnpm test:e2e
```

### Frontend
```bash
cd frontend

# Iniciar en dev
pnpm dev

# Verificar TypeScript
pnpm typecheck

# Lint
pnpm lint
```

### Docker
```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Verificar salud
docker-compose ps

# Parar todo
docker-compose down
```

**Gotcha de `.env`**: `docker compose restart backend` NO relee `env_file:` — el contenedor sigue con las variables horneadas al último `up`/`create`. Tras editar `.env`, usar `docker compose up -d --force-recreate backend` (o `up -d` completo) para que los cambios surtan efecto. Verificar con `docker exec tracker-sales-api printenv | grep TYPEORM` si hay duda de qué valor está usando realmente el contenedor.

---

## Verificar un CHECKPOINT completo

1. Leer el CHECKPOINT en `CHECKPOINTS.md` para la feature
2. Verificar backend:
   ```bash
   cd backend && pnpm tsc --noEmit && pnpm test
   ```
3. Verificar frontend:
   ```bash
   cd frontend && pnpm typecheck && pnpm lint
   ```
4. Verificar endpoints manualmente:
   - Swagger UI: http://localhost:3000/api/docs
   - O usar el archivo `requests.http` de la feature (si existe)
5. Verificar UI en browser: http://localhost:3001

---

## Migraciones TypeORM

Wiring de CLI en `backend/src/data-source.ts` (entidades + `migrations: ['src/migrations/*.ts']`). Scripts en `backend/package.json`:

```bash
cd backend

# Generar una migración a partir del diff entidades vs DB conectada
pnpm migration:generate src/migrations/<timestamp>-NombreDescriptivo

# Correr migraciones pendientes
pnpm migration:run

# Revertir la última migración
pnpm migration:revert
```

`app.module.ts` lee `TYPEORM_MIGRATIONS_RUN` del `.env` (antes hardcoded a `false`, ignoraba el env var — bug corregido en feature 46). En dev (`.env` raíz, Docker) y en prod (`.env.prod.example`) debe ser `true` con `TYPEORM_SYNCHRONIZE=false`.

**Regla para nuevas features**: cualquier cambio a una `*.typeorm.entity.ts` (columna nueva, tabla nueva, índice) DEBE ir acompañado de su migración correspondiente en el mismo PR — `TYPEORM_SYNCHRONIZE=false` ya no crea el schema automáticamente en ningún entorno con `migrationsRun=true`. Escribir migraciones nuevas con guards idempotentes (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$;` para `CREATE TYPE`/`ADD CONSTRAINT`) — no hay acceso directo a la DB de prod para confirmar su estado antes de desplegar, así que toda migración debe ser segura de correr sin importar si el objeto ya existe.

---

## Swagger UI

Disponible en: `http://localhost:3000/api/docs`

Todos los endpoints deben:
- Tener `@ApiTags('module-name')`
- Tener `@ApiBearerAuth()` si requieren JWT
- Tener decoradores de response (`@ApiResponse`)

---

## Backups de PostgreSQL en producción

La automatización de la feature `65-prod-db-backups` vive en `ops/postgres-backup/`. Genera un dump diario en formato custom de PostgreSQL, conserva 30 días y publica un checksum SHA-256. No contiene ni requiere copiar la contraseña de la base: `pg_dump` corre dentro del contenedor y usa su socket local.

### Instalación en el VPS

Ejecutar desde una copia actualizada del repositorio como `root`:

```bash
install -d -m 0700 /var/backups/tracker-sales-postgres
install -m 0750 ops/postgres-backup/backup.sh /usr/local/sbin/tracker-sales-db-backup
install -m 0750 ops/postgres-backup/restore-test.sh /usr/local/sbin/tracker-sales-db-restore-test
if [ ! -e /etc/tracker-sales-db-backup.conf ]; then
  install -m 0600 ops/postgres-backup/backup.conf.example /etc/tracker-sales-db-backup.conf
fi
install -m 0644 ops/postgres-backup/tracker-sales-db-backup.service /etc/systemd/system/tracker-sales-db-backup.service
install -m 0644 ops/postgres-backup/tracker-sales-db-backup.timer /etc/systemd/system/tracker-sales-db-backup.timer
install -d -m 0755 /usr/local/share/doc/tracker-sales-os
install -m 0644 docs/verification.md /usr/local/share/doc/tracker-sales-os/postgresql-backups.md
```

Antes de habilitar el timer o lanzar la primera corrida, revisar `/etc/tracker-sales-db-backup.conf`. Los defaults actuales esperan:

- contenedor: `tracker-sales-os-trackersales-hibdzn`;
- base y usuario PostgreSQL: autodetectados desde `POSTGRES_DB` y `POSTGRES_USER` del contenedor; pueden fijarse explícitamente si la inspección inicial confirma valores distintos;
- destino local: `/var/backups/tracker-sales-postgres`;
- retención: 30 días;
- espacio libre mínimo: 512 MiB.

Si la ruta de backups cambia, actualizar también `ReadWritePaths` en la unidad systemd y ejecutar `systemctl daemon-reload`.

Después de confirmar la configuración:

```bash
systemctl daemon-reload
systemctl enable --now tracker-sales-db-backup.timer
systemctl start tracker-sales-db-backup.service
```

### Operación diaria y observabilidad

```bash
# Próxima/última corrida
systemctl list-timers tracker-sales-db-backup.timer

# Resultado de la última corrida y logs detallados
systemctl status tracker-sales-db-backup.service
journalctl -u tracker-sales-db-backup.service --since '7 days ago'

# Fallos visibles para monitoreo del VPS
systemctl is-failed tracker-sales-db-backup.service

# Inventario sin exponer datos del dump
find /var/backups/tracker-sales-postgres -maxdepth 1 -type f -name '*.dump' -printf '%TY-%Tm-%TdT%TH:%TM:%TS %s %f\n' | sort

# Checksum del backup más reciente (ejecutar desde el directorio)
cd /var/backups/tracker-sales-postgres
sha256sum --check "$(find . -maxdepth 1 -type f -name '*.dump.sha256' -printf '%T@ %f\n' | sort -nr | awk 'NR == 1 { print $2; exit }')"
```

El timer corre a las 03:15 UTC con una demora aleatoria de hasta 15 minutos. `Persistent=true` hace que systemd ejecute una corrida pendiente después de un reinicio. Cada archivo se escribe a un temporal, se valida y sólo entonces se renombra al nombre definitivo; una corrida fallida no publica un dump parcial.

La retención sólo elimina archivos `*.dump` de más de `RETENTION_DAYS` dentro del directorio dedicado y el checksum hermano. No usar ese directorio para otros dumps que deban conservarse indefinidamente.

### Prueba de restauración aislada

La prueba levanta un contenedor efímero `postgres:18` con red deshabilitada. No crea, borra ni modifica bases dentro del contenedor de producción.

```bash
# Usa el backup más reciente
/usr/local/sbin/tracker-sales-db-restore-test

# O valida un archivo específico
/usr/local/sbin/tracker-sales-db-restore-test \
  /var/backups/tracker-sales-postgres/sales-os_YYYYMMDDTHHMMSSZ.dump
```

La prueba verifica el checksum cuando existe, ejecuta `pg_restore --exit-on-error`, exige al menos una tabla en `public` y confirma `public.users`. El contenedor temporal se elimina incluso si la restauración falla. Guardar en `progress/impl_65-prod-db-backups.md` la fecha UTC, nombre y tamaño del dump, checksum abreviado, número de tablas restauradas, resultado del servicio y próxima corrida; nunca copiar datos ni credenciales de producción.

### Restauración real por incidente

No restaurar encima de `sales-os` mientras la aplicación escribe. El flujo seguro es crear una base nueva, validar y después cambiar `POSTGRES_DB` durante una ventana de mantenimiento:

```bash
# 1. Detener escrituras de la API desde Dokploy.
# 2. Resolver el superusuario configurado y crear una base vacía de recuperación.
container=tracker-sales-os-trackersales-hibdzn
db_user="$(docker exec "$container" printenv POSTGRES_USER)"
docker exec --user postgres "$container" \
  createdb --username "$db_user" sales-os-recovery

# 3. Transmitir el dump por stdin y restaurar con corte ante el primer error.
# El shell root abre el archivo 0600; no queda una copia con permisos ambiguos en el contenedor.
docker exec --interactive --user postgres "$container" \
  pg_restore --username "$db_user" --dbname sales-os-recovery \
  --no-owner --no-acl --exit-on-error \
  </var/backups/tracker-sales-postgres/sales-os_YYYYMMDDTHHMMSSZ.dump

# 4. Validar tablas y conteos de negocio antes de apuntar la API a la base recuperada.
docker exec --user postgres "$container" \
  psql --username "$db_user" --dbname sales-os-recovery \
  --command "SELECT count(*) AS public_tables FROM pg_catalog.pg_tables WHERE schemaname = 'public';"
```

Rollback: mantener intacta la base original, revertir `POSTGRES_DB` al valor anterior y recrear el contenedor backend para que relea el entorno. Tras el incidente, eliminar la base de recuperación únicamente cuando exista aprobación explícita y otra copia verificada.

---

## Variables de entorno requeridas para tests

Para tests e2e se necesita una DB de test. Copiar `.env` a `.env.test`:
```bash
POSTGRES_DB=tracker_sales_os_test
NODE_ENV=test
```

---

## Criterio de TypeScript

El proyecto está configurado con:
- `strict: false` (para facilitar el scaffolding inicial)
- `noImplicitAny: false`

Una feature se considera lista cuando:
- `pnpm tsc --noEmit` no reporta errores en los archivos de la feature
- Los tests unitarios del use-case pasan
