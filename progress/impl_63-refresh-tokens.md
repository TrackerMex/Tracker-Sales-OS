# impl_63-refresh-tokens

Feature: `63-refresh-tokens` — Access token corto (15min) + refresh token (7d) con rotación, detección de reuso, y frontend con interceptor de refresh automático.

## Backend — archivos creados

- `backend/src/modules/auth/domain/entities/refresh-token.entity.ts` — `RefreshTokenEntity extends BaseEntity` con `userId`, `tokenHash`, `expiresAt`, `revokedAt`.
- `backend/src/modules/auth/domain/repositories/refresh-token.repository.interface.ts` — `IRefreshTokenRepository extends IRepository<RefreshTokenEntity>` + `revokeAllActiveForUser(userId)`. Token `REFRESH_TOKEN_REPOSITORY`.
- `backend/src/modules/auth/infrastructure/entities/refresh-token.typeorm.entity.ts` — `@Entity('refresh_tokens')`, `@ManyToOne` a `UserTypeormEntity` con `@JoinColumn({name:'user_id'})` y `onDelete: 'CASCADE'`, índice en `user_id`.
- `backend/src/modules/auth/infrastructure/repositories/refresh-token.repository.impl.ts` — impl TypeORM, mismo patrón `toDomain()` que `user.repository.impl.ts`.
- `backend/src/modules/auth/application/dtos/refresh.dto.ts` — `RefreshDto`, `RefreshResponseDto`.
- `backend/src/modules/auth/application/dtos/logout.dto.ts` — `LogoutDto`.
- `backend/src/modules/auth/application/use-cases/refresh-token.use-case.ts` + `.spec.ts` (6 tests: rotación exitosa, reuso→revoca todas las sesiones, expirado sin revocar de más, firma inválida, hash no coincide, fila no encontrada).
- `backend/src/modules/auth/application/use-cases/logout.use-case.ts` + `.spec.ts` (5 tests: revoca la fila correcta, no toca otras filas, no re-revoca una ya revocada, best-effort ante firma inválida, best-effort ante fila inexistente).
- `backend/src/migrations/1784032100000-CreateRefreshTokens.ts` — migración idempotente escrita a mano (sin acceso a DB en este entorno): `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, FK envuelta en `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$;`. Sin `deleted_at`.

## Backend — archivos modificados

- `backend/src/modules/auth/application/use-cases/login.use-case.ts` — ahora inyecta también `REFRESH_TOKEN_REPOSITORY` y `ConfigService`; además del access token, crea la fila en `refresh_tokens`, firma el refresh JWT (`sub` = id de la fila), calcula `expiresAt` decodificando el `exp` del JWT recién firmado, hashea con bcrypt (10 rounds) y actualiza la fila.
- `backend/src/modules/auth/application/use-cases/login.use-case.spec.ts` — actualizado al nuevo flujo (mock de `REFRESH_TOKEN_REPOSITORY`, `bcrypt.hash`, `decode`), + test nuevo de creación/hash de refresh token.
- `backend/src/modules/auth/application/dtos/login.dto.ts` — `LoginResponseDto` incluye `refreshToken: string`.
- `backend/src/modules/auth/presentation/auth.controller.ts` — agrega `POST /auth/refresh` y `POST /auth/logout`, sin `@UseGuards` (igual que `/login`).
- `backend/src/modules/auth/auth.module.ts` — `JWT_EXPIRES_IN` default `15m` (antes `7d`); registra `RefreshTokenTypeormEntity` en `TypeOrmModule.forFeature`, provider `REFRESH_TOKEN_REPOSITORY`, y los use-cases `RefreshTokenUseCase`/`LogoutUseCase`.
- `backend/src/data-source.ts` — agrega `RefreshTokenTypeormEntity` a la lista de entidades para el CLI de migraciones.
- `.env.example`, `backend/.env.example`, `.env.prod.example` — `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_SECRET=<placeholder>`, `JWT_REFRESH_EXPIRES_IN=7d`.

## Frontend — archivos creados

- `frontend/src/modules/auth/application/hooks/useLogout.ts` — hook TanStack Query; llama `authApi.logout(refreshToken)` en `mutationFn` y limpia el store en `onSettled` (corre siempre, incluso si la llamada de red falla) — garantiza que el logout local nunca quede bloqueado por un fallo de red.

## Frontend — archivos modificados

- `frontend/src/modules/auth/domain/auth.types.ts` — `LoginResponse` incluye `refreshToken`; agrega `RefreshRequest`, `RefreshResponse`, `LogoutRequest`.
- `frontend/src/modules/auth/infrastructure/auth.api.ts` — agrega `refresh(refreshToken)` y `logout(refreshToken)`.
- `frontend/src/modules/auth/application/hooks/useLogin.ts` — `setAuth` ahora recibe también `refreshToken`.
- `frontend/src/shared/store/app.store.ts` — nuevo estado `refreshToken`; `setAuth`/`clearAuth` ahora persisten/limpian `localStorage["refreshToken"]` con el mismo patrón manual que `accessToken` (fuera del middleware `persist` de zustand, igual que el campo existente).
- `frontend/src/shared/lib/axios.ts` — interceptor de response reescrito: en 401 (excluyendo requests a `/auth/login` y `/auth/refresh`), intenta `POST /auth/refresh` una sola vez usando una instancia `axios` directa (no la instancia `api`, para evitar recursión del propio interceptor), con flag módulo-level `isRefreshing` + cola `pendingCallbacks` para que requests concurrentes esperen el mismo refresh en vez de disparar N llamadas. Si el refresh tiene éxito, reintenta la request original con el `Authorization` actualizado. Si falla (o no hay `refreshToken` en localStorage), limpia `accessToken`/`refreshToken` y redirige a `/login` (comportamiento de fallback conservado).
- `frontend/src/components/nav-user.tsx` — `handleLogout` es ahora `async`, usa `useLogout().mutateAsync()` envuelto en `try/catch` (no bloquea el logout local si falla la red) y luego navega a `/login`.

## Decisiones tomadas dentro del margen abierto

1. **Cómo derivar `expires_at` del refresh JWT**: en vez de reimplementar un parser de strings tipo `'7d'`/`'15m'`, el `expiresAt` de la fila se calcula decodificando el `exp` (claim estándar JWT) del token recién firmado con `jwtService.decode<{exp:number}>(token)` y convirtiéndolo a `Date`. Evita duplicar lógica de parseo de duraciones y mantiene la fila siempre sincronizada con lo que el JWT realmente codifica.
2. **Orden de creación de la fila vs firma del JWT** (login y refresh): dado que el payload del refresh JWT necesita `sub = <id de la fila>`, la fila se crea primero con `tokenHash: ''` y un `expiresAt` placeholder, luego se firma el JWT con ese id, se decodifica el `exp`, se hashea el token y se actualiza la fila en una segunda escritura con `tokenHash` y `expiresAt` reales. Esto usa únicamente los métodos ya exigidos por `IRepository` (`create`/`update`), sin agregar métodos nuevos al repositorio más allá de `revokeAllActiveForUser`.
3. **`softDelete()` en `RefreshTokenRepositoryImpl`**: como `IRefreshTokenRepository extends IRepository<RefreshTokenEntity>` (por diseño explícito del checkpoint) pero la tabla `refresh_tokens` no tiene `deleted_at` (el ciclo de vida es `revoked_at`), `softDelete(id)` se implementó como fallback semánticamente razonable: marca `revoked_at = now()` en vez de lanzar o intentar `repo.softDelete()` de TypeORM (que fallaría en runtime al no existir `@DeleteDateColumn`). Ningún use-case de esta feature invoca este método; queda documentado inline en el código.
4. **Nombre de la FK en la migración hand-written**: sin acceso a una DB para correr `migration:generate` en este entorno (verificado con `pg_isready`/`docker ps`, ninguno disponible), la migración `1784032100000-CreateRefreshTokens.ts` se escribió a mano siguiendo el patrón idempotente exacto de `1749000000000-BaselineSchemaReconcile.ts` (`CREATE TABLE IF NOT EXISTS` + `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$;` para la FK). El nombre de constraint `FK_refresh_tokens_user_id` es legible en vez del hash que generaría TypeORM automáticamente — si en el futuro se corre `migration:generate` contra una DB real, es posible que TypeORM proponga renombrar esta constraint a su convención de hash; es un ajuste cosmético sin impacto funcional.
5. **Tests de mocks (`unbound-method` de `@typescript-eslint`)**: los specs nuevos usan el patrón `MockedMethods<T>` ya establecido en `change-deal-stage.use-case.spec.ts` (factory que tipa cada método como `jest.MockedFunction<T[Key]>`) en vez de `jest.Mocked<T>`, porque el segundo dispara `@typescript-eslint/unbound-method` al pasar `repo.metodo` como argumento bare a `expect(...)`. Mismo patrón, ninguna regla nueva.
6. **Formato de respuesta de logout**: `LogoutUseCase implements IUseCase<LogoutDto, void>`; el controller responde `200 OK` con body vacío (no se definió un DTO de respuesta porque el checkpoint no lo pide explícitamente).

## Resultado de verificación

- `cd backend && npx tsc --noEmit` → **sin errores**.
- `cd backend && npx jest --runInBand` → **13 suites, 72 tests, todos en verde** (11 suites/60 tests preexistentes + 2 suites nuevas con 12 tests nuevos: 1 test agregado a `login.use-case.spec.ts`, 6 en `refresh-token.use-case.spec.ts`, 5 en `logout.use-case.spec.ts`).
- `cd backend && npx eslint "{src,apps,libs,test}/**/*.ts"` → **sin errores** (no pedido explícitamente por el prompt, corrido igual porque CI lo exige en modo read-only).
- `cd frontend && npx tsc --noEmit` → **sin errores**.
- `cd frontend && npx eslint "src/**/*.{ts,tsx}"` → **sin errores**.
- `cd frontend && npx vite build` → build de producción exitoso (único warning es preexistente y no relacionado: `INEFFECTIVE_DYNAMIC_IMPORT` en `@atlaskit/pragmatic-drag-and-drop`, no tocado por esta feature).

## No verificado (requiere entorno corriendo, fuera de alcance de este agente)

- Verificación manual end-to-end: login → expirar access token → request protegida dispara refresh automático sin desloguear.
- Logout → el refresh token usado ya no puede canjearse (401).
- `/lamina` (feature 40) con el nuevo TTL de 15 min — no se modificó `frontend/src/routes/lamina.tsx` (solo chequea presencia de `accessToken` en `localStorage`, no su expiración, así que no debería verse afectado por el cambio de `JWT_EXPIRES_IN`).

No hubo acceso a una base de datos PostgreSQL corriendo en este entorno (`pg_isready` sin cliente instalado, sin acceso al socket de Docker), por lo que la migración no pudo generarse con `pnpm migration:generate` ni correrse/probarse contra una DB real; quedó escrita a mano siguiendo el patrón idempotente del repo (ver decisión 4).
