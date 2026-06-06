# Verificación — Tracker Sales OS

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
