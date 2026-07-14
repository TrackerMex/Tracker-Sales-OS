# Review 63-refresh-tokens

**Fecha**: 2026-07-14
**Resultado**: PASSED (todos los criterios verificados leyendo código real, sin hallazgos bloqueantes)

## Metodología

Lectura completa (no solo grep) de todos los archivos de dominio/aplicación/infraestructura/presentación del módulo `auth` tocados por la feature, la migración, los 3 `.env.example`, el interceptor axios, el store, los hooks de logout/login y `lamina.tsx`. Ejecución propia de `tsc --noEmit`, `jest --runInBand` y `eslint` en backend y frontend (no se confió en los números reportados por el Implementer sin reproducirlos).

## Backend — modelo y migración

- **PASS** — `refresh_tokens`: `RefreshTokenEntity` (dominio, sin TypeORM) en `backend/src/modules/auth/domain/entities/refresh-token.entity.ts`; `IRefreshTokenRepository extends IRepository<RefreshTokenEntity>` con `revokeAllActiveForUser(userId)` en `.../domain/repositories/refresh-token.repository.interface.ts`; `RefreshTokenTypeormEntity` en `.../infrastructure/entities/refresh-token.typeorm.entity.ts` con FK `@ManyToOne(() => UserTypeormEntity, { onDelete: 'CASCADE' })` + `@JoinColumn({ name: 'user_id' })`, columnas snake_case explícitas (`user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`, `updated_at`), índice `@Index('idx_refresh_tokens_user_id', ['userId'])`, **sin `deleted_at`**.
- **PASS** — `backend/src/migrations/1784032100000-CreateRefreshTokens.ts` completa: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, FK envuelta en `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`, tipos correctos (`uuid`, `character varying`, `TIMESTAMP WITH TIME ZONE`), `down()` hace `DROP CONSTRAINT IF EXISTS` + `DROP TABLE IF EXISTS` (razonable, reversible). Comparé línea por línea contra los decoradores de `RefreshTokenTypeormEntity`: tipos, nullability, nombre de índice y `ON DELETE CASCADE` son consistentes. El patrón replica exactamente el de `1749000000000-BaselineSchemaReconcile.ts` (precedente real del repo).
  - **Nota no bloqueante**: la migración fue escrita a mano (sin DB disponible para `pnpm migration:generate`), desviación documentada y justificada (deviation #4 del Implementer). Los nombres de constraint (`PK_refresh_tokens_id`, `FK_refresh_tokens_user_id`) son legibles en vez del hash que generaría TypeORM automáticamente — cosmético, sin impacto funcional, pero recomiendo correr `migration:generate` contra una DB real antes de producción para confirmar que TypeORM no proponga un diff.
- **PASS** — `data-source.ts` incluye `RefreshTokenTypeormEntity` en la lista de entidades del CLI de migraciones.

## Backend — emisión y rotación (crítico)

- **PASS** — `JWT_EXPIRES_IN` default baja a `15m` en `auth.module.ts:31`. `JWT_REFRESH_SECRET`/`JWT_REFRESH_EXPIRES_IN` (default `7d`) usados vía overrides de `secret`/`expiresIn` por llamada sobre el mismo `JwtService` inyectado (sin segundo `JwtModule`) — confirmado en `login.use-case.ts:57-60` y `refresh-token.use-case.ts:83-86`.
- **PASS** — `LoginUseCase` (`login.use-case.ts`): emite access token igual que antes (`sub/username/role/sellerId`), crea fila en `refresh_tokens`, firma refresh JWT `{sub: <id fila>, userId}`, hashea con `bcrypt.hash(token, 10)`, `LoginResponseDto` incluye `refreshToken`.
- **PASS** — `POST /auth/refresh` (`refresh-token.use-case.ts`) verificado línea por línea:
  - `jwtService.verify(dto.refreshToken, {secret: refreshSecret})` antes de confiar en `sub` (línea 45-50); si falla, `catch` limpio → `UnauthorizedException('Refresh token inválido')` sin distinguir causa (sin leak de info).
  - Lookup por PK: `refreshTokenRepo.findById(payload.sub)` (línea 52) — nunca por `user_id` abierto.
  - **Orden crítico correcto**: `revokedAt !== null` se chequea ANTES que `expiresAt` (líneas 55-64). Reuso de token ya revocado → `revokeAllActiveForUser(row.userId)` (revocación masiva) + 401. Expiración normal (`expiresAt` pasado) → 401 simple, **sin** llamar a `revokeAllActiveForUser`. Confirmado también por los specs (`refresh-token.use-case.spec.ts` líneas 140-165: el test de expirado verifica explícitamente `revokeAllActiveForUser` NO fue llamado).
  - `revokeAllActiveForUser` (`refresh-token.repository.impl.ts:59-64`) hace `this.repo.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() })` — scoping correcto por `userId`, no puede afectar filas de otro usuario.
  - `bcrypt.compare(dto.refreshToken, row.tokenHash)` (línea 66) antes de aceptar.
  - Rotación: revoca fila vieja (`update(row.id, {revokedAt: new Date()})`, línea 74) y luego crea fila nueva + emite JWT nuevo. El orden (revoke-then-create) es el que el checkpoint permite explícitamente ("al menos orden correcto... sin que el use-case lo reporte como error"): no hay `try/catch` que trague un fallo de `create()` a medio camino — si fallara, la excepción se propaga como error 500, no se devuelve una respuesta silenciosamente inconsistente. **Observación no bloqueante**: no está envuelto en una transacción de DB explícita; el orden ideal (crear primero, revocar después) evitaría incluso el escenario de bloqueo si `create()` fallara tras revocar. No es un hallazgo de seguridad (no hay leak ni bypass), es una mejora de robustez a futuro.
  - El nuevo `userId` viene siempre de `user.id` (resuelto vía `userRepo.findById(row.userId)`, línea 69), no del payload viejo — no hay mezcla posible entre usuarios.
  - Extra hardening no exigido explícitamente por el checkpoint pero presente y correcto: valida `user.active` antes de rotar (línea 70).
- **PASS** — `POST /auth/logout` (`logout.use-case.ts`): revuelve solo la fila hallada por `sub` del JWT recibido (líneas 39-42), nunca revoca por `userId` abierto. Es best-effort: todo el cuerpo está en un único `try/catch` que traga cualquier error (firma inválida, fila inexistente) y siempre resuelve sin lanzar (líneas 29-45). Confirmado por specs: revoca la fila correcta, no toca otras filas, no re-revoca una ya revocada, no lanza con firma inválida ni con fila inexistente.
- **PASS** — Ningún DTO nuevo (`RefreshResponseDto`, `LogoutDto`) expone `token_hash` ni datos de otro usuario.
- **PASS** — `auth.controller.ts`: `POST /auth/refresh` y `POST /auth/logout` sin `@UseGuards`, igual que `/login` (no hay guard global en este backend, confirmado por ausencia de `APP_GUARD` global en `app.module.ts`).
- **PASS** — `auth.module.ts`: providers/imports correctos, `TypeOrmModule.forFeature([UserTypeormEntity, RefreshTokenTypeormEntity])`.
- **Verificación de aislamiento entre secretos**: `JWT_SECRET` (access) y `JWT_REFRESH_SECRET` (refresh) son configuraciones separadas con defaults distintos (`changeme` vs `changeme-refresh`) y ambos `.env.example` los documentan como valores aleatorios distintos — un access token no puede reutilizarse como refresh token válido contra el mismo secreto.

## Backend — tests

- **PASS** — `login.use-case.spec.ts` actualizado: nuevo test de creación/hash de refresh token, payload de access token sin cambios.
- **PASS** — `refresh-token.use-case.spec.ts` (6 tests): rotación exitosa, reuso→revoca todas+401, expirado→401 sin revocar de más, firma inválida→401 sin llegar a buscar la fila, hash no coincide→401, fila no encontrada→401.
- **PASS** — `logout.use-case.spec.ts` (5 tests): revoca fila correcta, no toca otras filas, no re-revoca, best-effort ante firma inválida, best-effort ante fila inexistente.
- **PASS (reproducido)** — `cd backend && npx tsc --noEmit` → sin errores.
- **PASS (reproducido)** — `cd backend && npx jest --runInBand` → **13 suites, 72 tests, todos en verde**. Coincide exactamente con lo reportado por el Implementer.
- **PASS (reproducido, no exigido explícitamente pero corrido)** — `cd backend && npx eslint "{src,apps,libs,test}/**/*.ts"` → sin errores ni warnings.

## Frontend (crítico: axios.ts)

Archivo `frontend/src/shared/lib/axios.ts` leído completo y trazado línea por línea:

- **PASS** — Excluye `/auth/login` y `/auth/refresh` del auto-retry (línea 39-40, chequeado contra `url.includes(...)`). Además, la llamada de refresh dentro del interceptor usa la instancia `axios` global (raw), no la instancia `api` interceptada — evita recursión del propio interceptor por diseño, no solo por el chequeo de URL.
- **PASS** — Flag `isRefreshing` + cola `pendingCallbacks`: tracé el orden de ejecución — como no hay ningún `await` antes de `isRefreshing = true` (línea 76), el primer 401 que entra al handler corre síncronamente hasta esa línea antes de ceder el control; cualquier 401 concurrente que llegue después ve `isRefreshing === true` y se encola (líneas 62-74) en vez de disparar un refresh propio. Todos los encolados se resuelven con el mismo `newToken` vía `onRefreshed()` cuando el único refresh en curso termina.
- **PASS** — Si el refresh falla (catch de línea 92-97) o no hay `refreshToken` en localStorage (línea 55-58), `redirectToLogin()` limpia **ambos** `accessToken` y `refreshToken` de localStorage (líneas 29-30) antes de redirigir — no deja un refresh token viejo inválido persistiendo.
- **PASS** — La request original se reintenta con `originalRequest.headers.Authorization = Bearer ${data.accessToken}` (línea 90, y línea 70 para las encoladas) usando el token **nuevo**, no el cacheado en el config original.

## Frontend — resto de la superficie

- **PASS** — `app.store.ts`: `refreshToken` se guarda/borra en `localStorage` junto con `accessToken` en `setAuth`/`clearAuth`, mismo patrón manual (fuera del middleware `persist`) que el campo existente.
- **PASS** — `useLogout.ts` + `nav-user.tsx`: `handleLogout` es `async`, llama `logout.mutateAsync()` (que internamente llama `authApi.logout(refreshToken)`) envuelto en `try/catch` que no bloquea el logout local; `onSettled` de la mutation ejecuta `clearAuth()` siempre, incluso si la llamada de red falla. Backend llamado antes de limpiar el store local.
- **PASS** — `auth.types.ts`, `auth.api.ts`, `useLogin.ts`: tipos y wiring consistentes (`LoginResponse.refreshToken`, `RefreshRequest`/`RefreshResponse`/`LogoutRequest`, `authApi.refresh`/`authApi.logout`, `setAuth(user, accessToken, refreshToken)`).
- **PASS** — `frontend/src/routes/lamina.tsx` no fue tocado; confirmado que su `beforeLoad` solo verifica `localStorage.getItem('accessToken')` (presencia, no expiración) — no se ve afectado por el cambio de TTL de 15m.
- **PASS (reproducido)** — `cd frontend && npx tsc --noEmit` → sin errores.
- **PASS (reproducido, no exigido explícitamente pero corrido)** — `cd frontend && npx eslint .` → sin errores ni warnings.

## Verificación de las 5 desviaciones documentadas por el Implementer

Las 5 fueron verificadas leyendo el código real, no solo el resumen:

1. `expiresAt` decodificando `exp` del JWT recién firmado — confirmado en `login.use-case.ts:61,66` y `refresh-token.use-case.ts:87,92`.
2. Fila creada primero con placeholders, JWT firmado con su `id`, luego actualizada con `tokenHash`/`expiresAt` reales — confirmado en ambos use-cases.
3. `softDelete()` como fallback de revocación en `refresh-token.repository.impl.ts:51-57` — `grep -rn "softDelete" backend/src/modules/auth/` confirma que solo aparece en mocks de test y en la implementación del repositorio; ningún use-case real lo invoca.
4. Migración escrita a mano — confirmado, y verificada consistente contra los decoradores de la entidad TypeORM (ver sección de migración arriba).
5. Specs usan `MockedMethods<T>` — confirmado en `refresh-token.use-case.spec.ts` y `logout.use-case.spec.ts`; el patrón preexiste en `change-deal-stage.use-case.spec.ts` (verificado con grep, no es un precedente inventado).

## Verificación manual (no automatizable, fuera de alcance de este agente)

No ejecutada — requiere entorno corriendo (login real → esperar expiración → refresh automático; logout → token usado ya no canjeable). Documentado correctamente como pendiente por el Implementer. Recomiendo al Líder ejecutarla antes de mergear a `main`, dado que es la única verificación end-to-end real de la feature.

## Hallazgos no bloqueantes (mejoras sugeridas, no bloquean el checkpoint)

1. La rotación en `refresh-token.use-case.ts` no usa una transacción de DB explícita; el orden actual (revocar-luego-crear) es aceptado por el checkpoint porque cualquier fallo se reporta como error (no hay swallow), pero envolver `update`+`create` en una transacción (o invertir el orden a crear-primero) eliminaría incluso el escenario de bloqueo temporal de un usuario ante un fallo de DB a medio camino.
2. `refresh-token.use-case.spec.ts` no tiene un test explícito para el caso `user.active === false` en el flujo de refresh (el chequeo existe en el código, línea 70, pero no está cubierto por un test dedicado). Gap de cobertura menor, no de lógica.
3. Nombres de constraint hand-written en la migración (`PK_refresh_tokens_id`, `FK_refresh_tokens_user_id`) difieren del hash que generaría TypeORM — cosmético, ya documentado como decisión aceptada.

## Veredicto

**PASSED**. Los dos puntos críticos (rotación/detección de reuso en `refresh-token.use-case.ts` y el interceptor concurrente en `axios.ts`) fueron auditados línea por línea con foco en seguridad y no presentan vulnerabilidades: la detección de reuso no se dispara en expiración normal, la revocación masiva está correctamente scoped por `user_id`, no hay forma de que un refresh token de un usuario otorgue acceso a otro, y el logout es best-effort sin romper la UX local. `tsc`, `jest` y `eslint` fueron reproducidos independientemente en backend y frontend con resultados verdes, coincidiendo con lo reportado por el Implementer.
