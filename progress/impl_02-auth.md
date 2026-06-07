# impl_02-auth — Login / JWT / Guards / RBAC

## Archivos creados

- `backend/src/modules/auth/application/use-cases/login.use-case.ts`
- `backend/src/modules/auth/application/use-cases/seed.use-case.ts`
- `backend/src/modules/auth/infrastructure/strategies/jwt.strategy.ts`
- `backend/src/modules/auth/infrastructure/guards/jwt-auth.guard.ts`
- `backend/src/modules/auth/infrastructure/guards/roles.guard.ts`
- `backend/src/modules/auth/presentation/decorators/roles.decorator.ts`

## Archivos modificados

- `backend/src/modules/auth/application/dtos/login.dto.ts` — agregado `LoginUserDto`, `LoginResponseDto` incluye `user`
- `backend/src/modules/auth/presentation/auth.controller.ts` — completado con `LoginUseCase` inyectado
- `backend/src/modules/auth/auth.module.ts` — agregado `JwtModule`, `PassportModule`, guards, strategy, seed

## Correcciones aplicadas durante implementación

1. Import path de `use-case.interface` corregido: `../../../../core/...` (4 niveles, no 5)
2. `expiresIn` casteado a `any` para compatibilidad de tipos con `@nestjs/jwt`

## Resultado tsc --noEmit

Sin errores.

## Credenciales seed

- Usuario: `admin`
- Password: `Admin123!`
- Rol: `Admin`
- Se crea automáticamente en `onApplicationBootstrap` si no existe ningún usuario
