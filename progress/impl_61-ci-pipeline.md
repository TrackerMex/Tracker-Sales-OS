# Implementación 61-ci-pipeline

## Archivos

- Creado `.github/workflows/ci.yml`.
- Modificado `docs/verification.md`.
- Creado `progress/impl_61-ci-pipeline.md`.

No se modificaron dependencias, lockfiles, tests ni módulos de backend/frontend.

## Implementación

- Workflow activado para todo `pull_request` y todo `push` a `main`.
- Permisos globales mínimos: `contents: read`.
- `concurrency` por workflow y rama/PR, con cancelación de ejecuciones anteriores.
- Jobs independientes `Backend` y `Frontend`, ambos sobre `ubuntu-latest` y Node.js 22.
- Cache npm separada mediante `backend/package-lock.json` y `frontend/package-lock.json`.
- Backend: `npm ci`, TypeScript, ESLint sin `--fix` y Jest unitario serial. La configuración existente de Jest usa `rootDir: src`; no se ejecutan E2E de `backend/test/`.
- Frontend: `npm ci`, typecheck, lint y build de producción.
- Documentado que bloquear merges requiere configurar externamente en GitHub una branch protection rule o ruleset para `main`, con `Backend` y `Frontend` como required checks.

## Verificación local

No se volvió a ejecutar `npm ci` por instrucción del Líder. Un intento inicial dentro del sandbox falló porque npm estaba en modo `only-if-cached` y faltaba `@nestjs/config`; el intento con red fue interrumpido. Los comandos restantes se ejecutaron con las dependencias presentes y ninguno excedió 60 segundos.

### Backend

- `npx tsc --noEmit`: PASSED.
- `npx eslint "{src,apps,libs,test}/**/*.ts"`: FAILED en 20.7 s por deuda preexistente: 659 problemas (632 errores y 27 warnings), principalmente formato Prettier y reglas TypeScript. No se aplicó `--fix` ni se modificó código fuera del alcance.
- `npm test -- --runInBand`: PASSED en 11.8 s: 7 suites, 35 tests, 0 snapshots.

### Frontend

- `npm run typecheck`: PASSED.
- `npm run lint`: FAILED en 15.8 s por deuda preexistente: 78 problemas (76 errores y 2 warnings), principalmente reglas de React hooks, refs, Fast Refresh y `no-explicit-any`. No se modificó código fuera del alcance.
- `npm run build`: FAILED en 13.7 s después de completar `tsc -b`; Vite no pudo cargar el binding nativo local `@tailwindcss/oxide-win32-x64-msvc` y además reportó `spawn EPERM`. Es una incidencia de las dependencias/ejecución local en Windows; el job CI instalará desde cero en Ubuntu mediante `npm ci`.

## Caveats

- Los checks de lint quedarán rojos en CI hasta corregir la deuda existente de backend y frontend.
- La branch protection/ruleset no puede habilitarse desde estos archivos; requiere configuración en GitHub después de que aparezcan ambos checks.
- El build frontend debe confirmarse en GitHub Actions con una instalación limpia, dado el fallo del binding nativo local.

## Lint cleanup 2026-07-13

### Archivos modificados y creados

- Backend: 98 archivos autorizados bajo `backend/src/` (de los 99 revisados); 56 recibieron únicamente auto-fix/formato y los residuales semánticos se corrigieron sin cambiar contratos públicos ni reglas de autorización.
- Frontend: los 19 archivos autorizados fueron modificados.
- Frontend, auxiliares creados para separar exports no-componentes: `components/ui/badge-variants.ts`, `components/ui/button-variants.ts`, `components/ui/sidebar-context.ts`, `components/ui/tabs-list-variants.ts`, `modules/reports/presentation/components/executive-slide.utils.ts`, `modules/tasks/presentation/components/task-card.constants.ts` y `shared/components/forms/field-error-props.ts`.
- No se modificaron configuraciones ESLint, dependencias, manifests, lockfiles ni el workflow CI durante este pase.

### Categorías corregidas

- Backend: formato Prettier; DTOs y payload JWT tipados con `UserRole`; requests autenticados; resultados raw de TypeORM; JSON externo validado desde `unknown`; enums de importación; callbacks con `this` preservado; promesas flotantes; variables sin uso; assertions innecesarias; mocks Jest y harness transaccional tipados.
- Frontend: acceso a refs durante render; efectos que actualizaban estado; dependencias de hooks; pureza de render; `no-explicit-any`; resets y errores de formularios; catch/no-unused-expressions; Fast Refresh mediante extracción de helpers/variants.
- Los helpers no-componentes quedaron en módulos dedicados y sus consumidores importan desde esos módulos; no se desactivó ninguna regla global.

### Verificación completa

Backend:

- `npx eslint "{src,apps,libs,test}/**/*.ts"`: PASSED, 0 errores y 0 warnings.
- `npx tsc --noEmit`: PASSED.
- `npm test -- --runInBand`: PASSED, 7 suites y 35 tests.
- `npm run build`: PASSED.

Frontend:

- `npm run lint`: PASSED, 0 errores y 0 warnings.
- `npm run typecheck`: PASSED.
- `npm run build`: PASSED fuera del sandbox; Vite transformó 1587 módulos y generó el bundle de producción. Dentro del sandbox, el mismo comando falló al cargar el binding nativo de Tailwind y con `spawn EPERM`, confirmando que era una restricción ambiental.

Higiene:

- `git diff --check`: PASSED (solo avisos informativos de futura conversión LF/CRLF de Git en Windows).
- No se ejecutaron pruebas E2E.

### Fast Refresh cleanup follow-up

- Eliminados los cinco `eslint-disable-next-line react-refresh/only-export-components` de `badge.tsx`, `button.tsx`, `sidebar.tsx`, `tabs.tsx` y `FieldError.tsx`.
- `calendar.tsx` importa `buttonVariants` desde `button-variants.ts`; los formularios importan `fieldErrorProps` desde `field-error-props.ts`; los tres consumidores de `useSidebar` importan desde `sidebar-context.ts`.
- Los re-exports no-componentes sin consumidores externos fueron retirados; se conservaron los exports de componentes y tipos.
- `npm run lint`: PASSED, 0 errores y 0 warnings.
- `npm run typecheck`: PASSED.
- `npm run build`: PASSED fuera del sandbox; Vite transformó 1587 módulos y generó el bundle en 1.18 s.
- La búsqueda de `eslint-disable-next-line react-refresh/only-export-components` en los cinco archivos no devolvió coincidencias.

### Backend lockfile reconciliation follow-up

- Ejecutado `$env:NPM_CONFIG_OFFLINE='false'; npm install --package-lock-only` desde `backend/` para reconciliar `package-lock.json` contra el `package.json` existente.
- Solo cambió `backend/package-lock.json` (139 inserciones, 30 eliminaciones); se incorporaron las entradas faltantes de `@nestjs/config@4.0.4`, `@nestjs/throttler@6.5.0` y sus dependencias transitivas, y se corrigió la resolución inválida que impedía `npm ci`.
- `backend/package.json` quedó idéntico: SHA-256 antes y después `92F50B705F9CCBD162DD0F6A9D2C5C5F2F87AC232121B12D27D58D69FF8A1534`.
- No se declararon dependencias nuevas ni se modificó código.
- `$env:NPM_CONFIG_OFFLINE='false'; npm ci`: PASSED; instaló 764 paquetes y auditó 765.
- npm reportó 5 vulnerabilidades existentes (2 moderadas y 3 altas); no se ejecutó `npm audit fix` porque alteraría dependencias fuera del alcance.

### Form error focus fix follow-up

- Corregido `frontend/src/shared/lib/api-errors.ts`: los errores de campo ahora se derivan del summary y de un registro de campos descartados asociado a la identidad del error, sin actualizar estado dentro de efectos.
- `clearField(name)` descarta únicamente ese campo para el error actual; una identidad de error nueva vuelve a mostrar todos sus campos.
- El efecto de foco se ejecuta después del commit y usa `requestAnimationFrame` solo para consultar el DOM: enfoca el primer `[aria-invalid="true"]` y conserva el fallback al summary con `role="alert"`.
- No se añadieron timers, supresiones, casts `as any` ni acceso a refs durante render.
- `npm run lint`: PASSED, 0 errores y 0 warnings.
- `npm run typecheck`: PASSED.
- `npm run build`: PASSED fuera del sandbox; Vite transformó 1587 módulos y generó el bundle en 1.26 s.
