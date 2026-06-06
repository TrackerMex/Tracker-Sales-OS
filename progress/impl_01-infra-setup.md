# impl_01-infra-setup

## Packages installed

- `@nestjs/config` 4.0.4
- `@nestjs/throttler` 6.5.0

## Files modified

| File | Change |
|------|--------|
| `backend/src/app.module.ts` | Added ConfigModule, ThrottlerModule, TypeOrmModule.forRootAsync with env-based config |
| `backend/src/main.ts` | Added RequestMethod import; setGlobalPrefix now excludes GET / so health check returns 200 |
| `backend/src/app.controller.ts` | Changed getHello() to healthCheck() returning JSON { status, timestamp } |
| `backend/src/app.controller.spec.ts` | Updated test to match new healthCheck() method (removed AppService dependency) |
| `backend/tsconfig.json` | Changed module/moduleResolution from nodenext to commonjs/node (required for NestJS + relative imports without .js extensions) |
| `backend/src/modules/pipeline/domain/entities/deal.entity.ts` | Fixed broken import path (../../ -> ../../../) |
| `backend/src/modules/pipeline/domain/repositories/deal.repository.interface.ts` | Fixed broken import path (../../ -> ../../../) |
| `backend/src/modules/tasks/domain/entities/task.entity.ts` | Fixed broken import path (../../ -> ../../../) |

## TypeScript check result

`pnpm tsc --noEmit` — CLEAN (exit 0, no errors)

## CHECKPOINT 01-infra-setup status

- [ ] `docker-compose up -d` levanta postgres, backend y frontend — requires running stack
- [ ] `GET http://localhost:3000/` retorna 200 — code ready, requires running stack
- [ ] `GET http://localhost:3000/api/docs` muestra Swagger UI — code ready, requires running stack
- [x] `cd backend && pnpm start:dev` inicia sin errores TypeScript — tsc --noEmit CLEAN
- [ ] `cd frontend && pnpm dev` inicia sin errores TypeScript — out of scope for this task
- [ ] Variables de entorno documentadas en `.env.example` — pending (not in scope of this task)

## Notes

- `app.module.ts` uses `autoLoadEntities: true` so TypeORM will discover entities registered via `TypeOrmModule.forFeature()` in each module
- `synchronize: true` defaults to on (env-controlled via TYPEORM_SYNCHRONIZE)
- Throttle: 100 requests per 60s window
- Three pre-existing scaffold import bugs (one extra `..` level) were fixed as they blocked TypeScript compilation
