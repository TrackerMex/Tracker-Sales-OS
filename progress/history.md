# Historial de Features — Append Only

Este archivo NUNCA se modifica, solo se agrega al final.

---

## 2026-06-05 — Scaffolding inicial

**Acción**: Setup completo del proyecto
**Resultado**: 
- Harness SubAgents Pattern configurado (CLAUDE.md, AGENTS.md, CHECKPOINTS.md, feature_list.json)
- Clean Architecture scaffold creado (backend + frontend)
- Docker Compose configurado
- Documentación de arquitectura migrada y actualizada con gaps corregidos
- 15 features definidas en feature_list.json, todas `pending`

**Siguiente feature**: 01-infra-setup

---

## 2026-06-06 — Feature 01-infra-setup (código completo)

**Acción**: Implementación de infraestructura NestJS
**Cambios**:
- `backend/src/app.module.ts`: ConfigModule (global), ThrottlerModule (100 req/60s), TypeOrmModule.forRootAsync con env vars
- `backend/src/main.ts`: GET / excluido del global prefix 'api' para health check
- `backend/src/app.controller.ts`: retorna `{ status: 'ok', timestamp }` JSON
- `backend/tsconfig.json`: fix crítico nodenext → commonjs/node (NestJS no es ESM)
- `backend/src/modules/pipeline/domain/` y `tasks/domain/`: fix import paths rotos
- Instalado: `@nestjs/config` 4.0.4, `@nestjs/throttler` 6.5.0
**Verificación**: `pnpm tsc --noEmit` LIMPIO. Runtime pendiente.
**Estado**: `in_progress` — falta verificación runtime (docker-compose up + endpoints)

---

## 2026-06-06 — Review 01-03 (PASSED)

**Acción**: Revisión de CHECKPOINTS 01, 02 y 03.
**Resultado**:
- `01-infra-setup`: PASSED. Configuración, health check, Swagger, Dockerfiles y variables de entorno revisados.
- `02-auth`: PASSED. Login/JWT/guards/RBAC/frontend login revisados.
- `03-users-sellers`: PASSED. CRUD base de users/sellers, bloqueo y página Equipo revisados.
- `CHECKPOINTS.md` actualizado con 01-03 marcados como completos.
- Reporte guardado en `progress/review_01-03.md`.
**Verificación**:
- `npm.cmd exec tsc -- --noEmit` en backend: limpio.
- `npm.cmd exec tsc -- --noEmit` en frontend: limpio.
- `npm.cmd test -- --runInBand` en backend: 2 suites / 6 tests passing.
**Siguiente feature**: 04-clients

---
