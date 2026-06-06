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
