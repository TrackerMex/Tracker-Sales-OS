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
