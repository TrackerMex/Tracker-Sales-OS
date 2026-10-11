# Implementación 86-role-queries-team-feedback

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`.

## Resultado

`useUsers` sólo consulta como Admin. `useMonthlyReport` y `useWinLoss` sólo consultan como Admin/Director; mensual además requiere month. Los hooks leen `useAppStore` y reutilizan UserRole. Los permisos reflejan los controllers backend existentes, sin ampliarlos.

Reportes y Lámina muestran Acceso no disponible para Seller o sesión sin rol autorizado antes de renderizar cualquier reporte, incluso si TanStack Query conserva datos cargados por Admin. Director conserva Alta comercial y lista de vendedores en Equipo; no ve creación/lista de usuarios ni acciones de baja/activación de vendedores, reservadas a Admin. Settings y Coaching no se modifican.

La ampliación autorizada corrige baja/reactivación real: el endpoint actual alterna active y sincroniza la cuenta vinculada. Seller missing/deleted produce404 antes de writes. La sincronización usa ahora setActiveBySellerId para todas las cuentas no borradas vinculadas por users.seller_id, además de conservar la rama legacy sellers.user_id, protegida con findById y guard de cuenta existente/no borrada/dueño null o actual; no pagina ni recorre usuarios. No cambia CreateUser ni schema. `GET /sellers/all` está reservado a Admin y lista vendedores no borrados incluyendo inactivos, sin alterar la lectura default activa ni findAll/paginación. Equipo Admin usa esa query con key distinta; Director y los formularios conservan GET /sellers activo. Al alternar, el hook invalida sellers y users y espera ambos refetch para mantener estados coherentes.

La confirmación de Equipo llama preventDefault en AlertDialogAction para impedir cierre automático. Mantiene la acción abierta durante procesamiento y en error; usa isPending para deshabilitar Confirmar/Cancelar y evita cierre por onOpenChange pendiente. Error muestra toast y permite reintentar. Éxito muestra toast específico y cierra. Se conserva el mecanismo returnFocusId del trigger de la fila, con respaldo al control estable seller-name si el trigger desaparece, y los componentes shadcn/Radix existentes.

## Archivos exactos

- `frontend/src/modules/equipo/application/hooks/useUsers.ts`: enabled sólo Admin.
- `frontend/src/modules/reports/application/hooks/useMonthlyReport.ts`: enabled Admin/Director con month.
- `frontend/src/modules/reports/application/hooks/useWinLoss.ts`: enabled Admin/Director.
- `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx`: UI permitida por rol, confirmación pendiente/error/retry/éxito y feedback.
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`: acceso explícito antes de renderizar datos, también con caché.
- `frontend/src/modules/reports/presentation/pages/LaminaPage.tsx`: mismo control de acceso.

Ampliación frontend:

- `frontend/src/modules/equipo/infrastructure/equipo.api.ts`: getAllSellers para gestión Admin.
- `frontend/src/modules/equipo/application/hooks/useSellers.ts`: opción de gestión con key sellers/all sólo Admin; default activo intacto.
- `frontend/src/modules/equipo/application/hooks/useDeactivateSeller.ts`: invalidación conjunta sellers/users tras éxito, sin mutaciones adicionales.

Backend:

- `backend/src/modules/sellers/application/use-cases/deactivate-seller.use-case.ts`: alterna estado y sincroniza usuario; missing/deleted404.
- `backend/src/modules/sellers/application/use-cases/deactivate-seller.use-case.spec.ts` (nuevo): 11 casos: ambos sentidos por sellerId con inverso userId=null; legacy con sellerId null/actual en ambos sentidos; legacy missing/deleted/ajeno sin actualizar; seller missing/deleted sin writes. Sólo repositorios mock.
- `backend/src/modules/sellers/application/use-cases/get-sellers.use-case.ts`: input opcional includeInactive, default activo conservado.
- `backend/src/modules/sellers/application/use-cases/get-sellers.use-case.spec.ts` (nuevo): 3 casos, default/false sólo activos y gestión incluye inactivos. Sólo repo mock.
- `backend/src/modules/sellers/domain/repositories/seller.repository.interface.ts`: método requerido findAllIncludingInactive.
- `backend/src/modules/sellers/infrastructure/repositories/seller.repository.impl.ts`: lectura no paginada de gestión con deletedAt IsNull; findAll/findAllActive intactos.
- `backend/src/modules/sellers/presentation/sellers.controller.ts`: GET all Admin con JWT/roles existentes; permisos anteriores intactos.
- `backend/src/modules/tasks/application/use-cases/create-task.use-case.spec.ts` y `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts`: únicamente mock jest.fn del nuevo método requerido de ISellerRepository; expectativas anteriores intactas.

Ampliación para el flujo normal de cuenta vinculada (hallazgo posterior a los 67 checks iniciales):

- `backend/src/modules/auth/domain/repositories/user.repository.interface.ts`: método setActiveBySellerId(sellerId, active).
- `backend/src/modules/auth/infrastructure/repositories/user.repository.impl.ts`: update con sellerId y deletedAt IsNull, sólo active; una operación sin paginación.
- `backend/src/modules/auth/infrastructure/repositories/user.repository.impl.spec.ts` (nuevo): ambos sentidos y filtro exacto por dueño/no borrado sobre el repositorio TypeORM mock.
- `backend/src/modules/auth/application/use-cases/login.use-case.spec.ts` y `backend/src/modules/auth/application/use-cases/refresh-token.use-case.spec.ts`: únicamente mock jest.fn del nuevo método requerido; expectativas anteriores conservadas.

Core leído antes de implementar, sin editarlo. No cambios de dependencias, estructura, metadata, scoring ni features87/88. Se conservan83/84/85.

## Gates

Logs con comando, directorio, timestamps UTC y exit:

| Directorio | Comando | Resultado | Evidencia |
|---|---|---|---|
| backend | `pnpm exec tsc --noEmit` | exit0 | [`86-link-backend-tsc.log`](/tmp/tracker-sales-bugfix-qa/86-link-backend-tsc.log) |
| backend | `pnpm exec eslint "{src,apps,libs,test}/**/*.ts"` | exit0 sin --fix | [`86-link-backend-lint.log`](/tmp/tracker-sales-bugfix-qa/86-link-backend-lint.log) |
| backend | `pnpm test --runInBand` | exit0;21suites/129tests | [`86-link-backend-tests.log`](/tmp/tracker-sales-bugfix-qa/86-link-backend-tests.log) |
| frontend | `pnpm exec tsc --noEmit -p tsconfig.app.json` | exit 0 | [`86-link-frontend-tsc.log`](/tmp/tracker-sales-bugfix-qa/86-link-frontend-tsc.log) |
| frontend | `pnpm run typecheck` | exit 0 | [`86-link-frontend-typecheck.log`](/tmp/tracker-sales-bugfix-qa/86-link-frontend-typecheck.log) |
| frontend | `pnpm run lint` | exit 0 | [`86-link-frontend-lint.log`](/tmp/tracker-sales-bugfix-qa/86-link-frontend-lint.log) |
| frontend | `pnpm run build` | exit 0 | [`86-link-frontend-build.log`](/tmp/tracker-sales-bugfix-qa/86-link-frontend-build.log) |

`git diff --check` exit 0. Build conserva la advertencia preexistente del adaptador Atlaskit. No tests unitarios adicionales para duplicar la lógica de hooks; la regresión significativa de roles/caché y respuestas lentas/fallidas se ejecuta en browser por QA.

## QA real

Fuente frontend estable notificada al Líder y a QA antes de pruebas after con Vite HMR. Tras la ampliación se notificó backend/frontend estable para recompilar únicamente API QA con86. Runtime no cambia durante after. Sólo UI127.0.0.1:3001/API127.0.0.1:3005 y DB aislada5434.

QA ejecutó **67/67 checks iniciales PASS**. Evidencia y comandos completos en [`progress/qa_82-88-bugfixes.md`](/home/claude/sites/Tracker-Sales-OS/progress/qa_82-88-bugfixes.md), sección Resultado QA86:

| Escenario | Resultado | Evidencia bajo /tmp/tracker-sales-bugfix-qa/ |
|---|---|---|
| GET all/lectura activa, permisos y baja/reactivación con inverso legacy preparado | 13/13 | [`86-backend/result.json`](/tmp/tracker-sales-bugfix-qa/86-backend/result.json), [`86-backend.log`](/tmp/tracker-sales-bugfix-qa/86-backend.log) |
| Admin/Director/Seller; Settings y coaching autorizado | 9/9 + 10/10 + 10/10 | `86-roles-after-{admin,director,seller}/result.json`, [`86-roles.log`](/tmp/tracker-sales-bugfix-qa/86-roles.log) |
| Cambio SPA Admin→Director→Seller con caché previa, sin recarga | 5/5 | [`86-cache-after/result.json`](/tmp/tracker-sales-bugfix-qa/86-cache-after/result.json) |
| Usuario: cancelar/Escape, pendiente sin duplicados, error/retry/success, foco | 10/10 | [`86-team-user/result.json`](/tmp/tracker-sales-bugfix-qa/86-team-user/result.json), [`86-team-feedback.log`](/tmp/tracker-sales-bugfix-qa/86-team-feedback.log) |
| Vendedor: mismos casos y estados SQL/UI de ambas cuentas | 10/10 | [`86-team-seller/result.json`](/tmp/tracker-sales-bugfix-qa/86-team-seller/result.json), mismo log de feedback |

Comandos secuenciales reproducibles: `node progress/bugfix-qa/86-fixture.cjs`, `node progress/bugfix-qa/86-backend.cjs`, `node progress/bugfix-qa/86-roles.cjs repeat`, `node progress/bugfix-qa/86-team-feedback.cjs`. Las fixtures dedicadas terminan activas; el comercial creado por Director se limpió por ID. La prueba inicial de sincronización preparaba sellers.user_id por SQL local y no acreditaba el vínculo normal generado por Equipo.

Permisos/caché no registraron errores HTTP, consola ni tráfico bloqueado. Cada contexto de feedback registra el 500 local forzado y su mensaje de recurso como evidencia esperada del error; no se presenta como ausencia total de errores HTTP. Capturas pending/failure-retry/active-final permanecen junto a cada result.json.

**Tail posterior fallido, conservado como evidencia anterior al arreglo:** `node progress/bugfix-qa/86-normal-link.cjs before-fix` produjo **2PASS/1FAIL**: POST seller201 + POST user(sellerId)201, sin SQL inverso, guarda users.seller_id y deja sellers.user_id=null; baja200 dejaba user.active=true. Evidencia [`86-normal-link-before-fix/result.json`](/tmp/tracker-sales-bugfix-qa/86-normal-link-before-fix/result.json) y [`86-normal-link-before-fix.log`](/tmp/tracker-sales-bugfix-qa/86-normal-link-before-fix.log). La ampliación de repo/use-case descrita arriba corrige esa selección. Los siete gates del flujo corregido PASS: backend tsc/eslint sin --fix/tests finales (21 suites/129 tests), y los cuatro frontend ya ejecutados a las 05:09 UTC antes del último ajuste sólo backend. Hashes/mtimes frontend en [`86-link-frontend-source-hashes.log`](/tmp/tracker-sales-bugfix-qa/86-link-frontend-source-hashes.log). El log lint conserva el fallo inicial de formato del spec y las repeticiones finales exitosas. Backend estable notificado al Líder/QA después de los gates finales, para recompilar únicamente API QA3005. La repetición real del flujo normal y la protección de cuentas ajenas/borradas pasaron; sus resultados finales se detallan a continuación.

### Repetición final tras corregir vínculo normal y guard legacy

**81/81 checks finales PASS**, verificados en los JSON de QA sobre API local recompilada y frontend sin cambios; QA confirmó exit0 de todos los procesos y fixtures normales seller/owner/peer activas al terminar:

| Escenario final | Resultado | Evidencia |
|---|---|---|
| POST seller + dos POST users(sellerId), sin SQL inverso; baja/reactivación de ambos, ajenas y borradas intactas | 5/5 | [`86-normal-link-final/result.json`](/tmp/tracker-sales-bugfix-qa/86-normal-link-final/result.json), [`86-normal-link-final.log`](/tmp/tracker-sales-bugfix-qa/86-normal-link-final.log) |
| Legacy dueño null/actual en ambos sentidos; legacy ajeno/borrado conservado | 9/9 | [`86-legacy-link-final/result.json`](/tmp/tracker-sales-bugfix-qa/86-legacy-link-final/result.json), [`86-legacy-link-final.log`](/tmp/tracker-sales-bugfix-qa/86-legacy-link-final.log) |
| Listados activos/gestión, JWT/roles y baja/reactivación | 13/13 | [`86-backend-final/result.json`](/tmp/tracker-sales-bugfix-qa/86-backend-final/result.json), [`86-backend-final.log`](/tmp/tracker-sales-bugfix-qa/86-backend-final.log) |
| Confirmación usuario normal, pendiente/error/retry/éxito y foco | 10/10 | [`86-team-normal-user/result.json`](/tmp/tracker-sales-bugfix-qa/86-team-normal-user/result.json), [`86-team-normal-feedback.log`](/tmp/tracker-sales-bugfix-qa/86-team-normal-feedback.log) |
| Confirmación vendedor normal, sincronización SQL/UI de cuentas y foco | 10/10 | [`86-team-normal-seller/result.json`](/tmp/tracker-sales-bugfix-qa/86-team-normal-seller/result.json), mismo log de feedback normal |
| Tres roles, Settings/Coaching permitido y consultas bloqueadas en Seller | 9/9 + 10/10 + 10/10 | `86-roles-final-{admin,director,seller}/result.json`, [`86-roles-final.log`](/tmp/tracker-sales-bugfix-qa/86-roles-final.log) |
| Caché Admin→Director→Seller en el mismo documento SPA | 5/5 | [`86-cache-final/result.json`](/tmp/tracker-sales-bugfix-qa/86-cache-final/result.json), mismo log de roles final |

Los casos normal-link crean las asociaciones normales mediante HTTP; SQL local sólo prepara la fixture borrada y lee los estados persistidos. El caso legacy null también se crea mediante las APIs públicas. Las cuentas protegidas mantienen sus valores y las propias cambian false→true en ambos modelos. El feedback repetido utiliza la cuenta normal con sellers.user_id=null, comprueba refetch de ambas listas y devuelve el foco a los controles de fila actualizados. Sólo el 500 forzado aparece en feedback; roles/caché no registran errores ni consultas prohibidas.

Orden real final: `node progress/bugfix-qa/86-normal-link.cjs final`, `node progress/bugfix-qa/86-legacy-link.cjs`, `node progress/bugfix-qa/86-backend.cjs` (sin argumento; resultado archivado por QA en 86-backend-final), `node progress/bugfix-qa/86-team-feedback.cjs normal`, `node progress/bugfix-qa/86-roles.cjs final`. El runner backend ahora admite argumento final para reproducir directamente en esa carpeta, pero esa variante no fue el comando de la ejecución reportada. Por colisión de salida, QA reconstruyó el JSON backend inicial de 13 checks desde el log completo 86-backend.log; ambos logs inicial/final se conservan, y el resultado final proviene de la repetición real. El dictamen independiente y cierre del lote corresponden al Reviewer/Líder.

Sin commits/push ni acciones de producción. No se avanzó al lote 87. Dictamen independiente corresponde al Reviewer.
