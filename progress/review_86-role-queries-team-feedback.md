# Revisión 86-role-queries-team-feedback

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`. Base revisada: `37579bae4575a2b3c8589ba80471331737e228e5`.

**What this change does:** Restringe consultas y contenido por los permisos reales del rol, conserva confirmaciones de Equipo durante espera/error y permite baja/reactivación real de vendedores con sus cuentas vinculadas.

**Resultado: PASSED — 7/7 criterios del CHECKPOINT verificados.**

Leí AGENTS.md, docs/conventions.md, CHECKPOINT86, el resumen final [impl_86-role-queries-team-feedback.md](/home/claude/sites/Tracker-Sales-OS/progress/impl_86-role-queries-team-feedback.md), contratos, controllers, callers y los archivos implementados desde disco. Revisé el diff contra la base y los tres specs nuevos. Los 23 archivos de fuente/spec conservaron sus hashes entre las comprobaciones finales y este dictamen; la última edición fue 05:10:47 UTC. Core, dependencias, configuración, schema y scoring no cambiaron. Los cuatro mocks existentes sólo agregan el método requerido, sin alterar expectativas.

## Criterios

| # | Veredicto | Evidencia verificada |
|---|---|---|
| 1 | PASSED | `useUsers.enabled` exige Admin; monthly/win-loss exigen Admin/Director y monthly conserva month obligatorio. Browser final: Admin users200, Director sin users, managers reportes200 y Seller sin consultas prohibidas. |
| 2 | PASSED | Reportes/Lámina muestran «Acceso no disponible» para Seller antes de renderizar datos. URLs directas no consultan reportes. Cambio SPA Admin→Director→Seller conserva el documento y caché: Director no expone usuarios Admin y Seller no expone reportes/lámina. Director conserva GET sellers200 y alta comercial POST201; no recibe acciones Admin. |
| 3 | PASSED | Settings GET200 con los tres roles; Coaching propio Seller y Coaching permitido de managers GET200. Sus hooks/callers y permisos permanecen intactos. Import/export usa mutaciones iniciadas por acción, sin consultas automáticas que requieran nuevos bloqueos. |
| 4 | PASSED | `AlertDialogAction` previene cierre automático; pending deshabilita ambos botones y rechaza cierre. Para usuario y vendedor del flujo normal, PATCH retenido mantiene un único diálogo; doble clic, Cancelar y Escape no agregan envíos. El 500 local deja error visible, diálogo abierto y retry habilitado. |
| 5 | PASSED | Retry200 y activación/reactivación muestran toast específico y cierran. Cancelar/Escape idle producen cero PATCH. Browser registra foco en el botón de fila actualizado al cancelar, escapar y completar ambas acciones. Se usan AlertDialog/DropdownMenu shadcn/Radix; respaldo estable `seller-name` en source. |
| 6 | PASSED | Repetición final con tres roles, caché compartida y espera/error/retry sobre cuentas normales: 81/81 checks PASS. Frontend tsc app, typecheck app+node, lint y build exit0. |
| 7 | PASSED | HTTP/SQL normal prueba dos cuentas creadas por POST users(sellerId), con seller.userId=null: baja/reactiva200 sincroniza ambas; ajena y borrada conservan estado. Legacy null/propio funcionan; legacy ajeno/borrado queda intacto. GET sellers/all exige Admin200, otros roles403 y anónimo401; GET sellers normal sólo activos200 en tres roles. Equipo Admin conserva inactivos y usa key distinta; invalidación espera sellers+users. Backend tsc/lint/full tests PASS. |

## Evidencia final

Leí runners persistentes, JSON y logs. Los siguientes resultados suman 81 checks, todos positivos:

- [Roles Admin](/tmp/tracker-sales-bugfix-qa/86-roles-final-admin/result.json) 9/9, [Director](/tmp/tracker-sales-bugfix-qa/86-roles-final-director/result.json) 10/10, [Seller](/tmp/tracker-sales-bugfix-qa/86-roles-final-seller/result.json) 10/10 y [caché SPA](/tmp/tracker-sales-bugfix-qa/86-cache-final/result.json) 5/5; log `86-roles-final.log`.
- [Confirmación usuario normal](/tmp/tracker-sales-bugfix-qa/86-team-normal-user/result.json) 10/10 y [vendedor normal](/tmp/tracker-sales-bugfix-qa/86-team-normal-seller/result.json) 10/10; log `86-team-normal-feedback.log`.
- [Vínculo normal](/tmp/tracker-sales-bugfix-qa/86-normal-link-final/result.json) 5/5, [vínculo legacy](/tmp/tracker-sales-bugfix-qa/86-legacy-link-final/result.json) 9/9 y [permisos/listados](/tmp/tracker-sales-bugfix-qa/86-backend-final/result.json) 13/13; logs homónimos final.

Los resultados iniciales 67 PASS y el [fallo del vínculo normal antes de corregirlo](/tmp/tracker-sales-bugfix-qa/86-normal-link-before-fix/result.json) permanecen separados. El Reviewer reprodujo independientemente ese fallo con el use case real y repositorios mock; QA lo confirmó por HTTP/SQL. La aprobación usa los resultados finales después de ampliar la selección por `users.seller_id` y proteger la rama legacy. Los registros de feedback conservan el 500 forzado y su error de recurso esperado; roles/caché no tienen errores ni tráfico bloqueado. API final recompilada, UI3001/API3005 y DB QA5434.

## Verificación técnica

Ejecuté independientemente `pnpm test --runInBand --runTestsByPath` para DeactivateSellerUseCase, GetSellersUseCase y UserRepositoryImpl: **3 suites/16 tests PASS**, exit0. Verifica normal, legacy compatible, missing/deleted/foreign, selección activa/gestión y filtro de UPDATE. `git diff --check` exit0.

| Gate | Resultado | Log leído bajo /tmp/tracker-sales-bugfix-qa/ |
|---|---|---|
| Backend tsc --noEmit | exit0 | `86-link-backend-tsc.log` |
| Backend eslint, sin --fix | exit0 final | `86-link-backend-lint.log` |
| Backend Jest completo | exit0; 21 suites/129 tests | `86-link-backend-tests.log` |
| Frontend tsc app | exit0 | `86-link-frontend-tsc.log` |
| Frontend typecheck app+node | exit0 | `86-link-frontend-typecheck.log` |
| Frontend lint | exit0 | `86-link-frontend-lint.log` |
| Frontend build | exit0 | `86-link-frontend-build.log` |

Gates backend finales posteriores a la última edición. Frontend conserva hashes de la ejecución exit0 de las 05:09 UTC; no repetí build. Lint conserva el fallo anterior de formato y las repeticiones exitosas. Build conserva las advertencias de Atlaskit y chunk mayor a 500 kB.

No quedan hallazgos bloqueantes ni criterios pendientes. El Reviewer escribió únicamente este archivo, sin editar fuente/tests/config/metadatos ni hacer commit/push.

**Verdict: Ship.**
