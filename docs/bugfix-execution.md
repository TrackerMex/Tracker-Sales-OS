# Ejecución de bugs pendientes — 2026-10-11

Base: `origin/dev` (`1e77c4e`); rama `fix/bugs-pendientes`.
El usuario autorizó corregir los bugs y aplicar el ciclo de implementación, review, regresión y publicación en dev. Incluyó expresamente la lámina (#13).

| Lote | Feature | Bugs | Estado |
|---|---|---|---|
| 0 | `82-frontend-typecheck` | 14 | DONE — review PASSED |
| 1 | `83-timepicker-calendar` | [1, 3] | DONE — review PASSED |
| 2 | `84-admin-seller-assignment` | 2 | DONE — review PASSED |
| 3 | `85-client-pipeline-integrity` | [4, 5, 8, 10] | DONE — review PASSED |
| 4 | `86-role-queries-team-feedback` | [6, 7] | DONE — review PASSED |
| 5 | `87-dialog-mobile-copy` | [9, 11, 12] | DONE — review PASSED |
| 6 | `88-executive-slide-responsive` | 13 | DONE — review PASSED |

## Protocolo

1. Cada Implementer recibe feature ID, paths exactos, tipos e interfaces con path, convenciones de `docs/conventions.md`, CHECKPOINT y resumen obligatorio en `progress/impl_<feature-id>.md`.
2. Un solo Implementer modifica código a la vez. El Líder coordina y no edita módulos ni tests.
3. Reviewer independiente lee implementación y resumen desde disco; ningún criterio sin verificar puede obtener PASSED. Guarda `progress/review_<feature-id>.md`.
4. Revisiones estáticas y regresiones por lote, con QA real final del stack local y tres roles, 1440/390, claro/oscuro. Resumen de QA en `progress/qa_82-88-bugfixes.md`.
5. Frontend: `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`. Backend: `pnpm exec tsc --noEmit`, `pnpm exec eslint "{src,apps,libs,test}/**/*.ts"`, `pnpm test --runInBand` cuando corresponda. No usar el script backend lint que incluye --fix durante la revisión.
6. Commits enfocados y publicación en dev tras PASS. No merge a main ni despliegue de producción: ese paso sigue separado.

## Entorno de QA

Usar Postgres aislado en 127.0.0.1:5434, API local en 127.0.0.1:3005 y Vite en 127.0.0.1:3001 con `VITE_API_URL=http://127.0.0.1:3005`.
Los contenedores tracker-sales-api/ui/nginx corresponden a producción; no se reinician ni usan para escrituras de pruebas.
Los archivos previos no versionados en progress/ se conservan y no se incluyen en commits de correcciones.

Hallazgo relacionado incluido en 86: Reactivar vendedor reutilizaba una operación que siempre guardaba active=false y Equipo sólo recibía vendedores activos. Se corrige el estado real y se agrega lectura de gestión exclusiva de Admin, conservando el listado activo para los formularios. En 87 se incluye también el foco de la paleta de búsqueda (baseline Escape devuelve BODY).

La review de 86 reprodujo otro caso del mismo flujo: Crear acceso guarda users.seller_id sin sellers.user_id. Se requiere sincronizar cuentas por la relación real; el primer fixture inverso no basta para aprobarlo. El tail fallido y su corrección quedan registrados en QA/impl/review.

## Cierre del ciclo — 2026-10-11

Los bugs 1–14 están corregidos. Los lotes 82–88 están done, con siete reviews independientes PASSED y CHECKPOINTS completos. La suite backend final pasó 21 suites y 129 tests; frontend tsc, typecheck, lint y build también pasaron. El QA de API/UI cubre tres roles y escritorio/móvil en claro/oscuro. La lámina pasó 128/128 comprobaciones y 33/33 de impresión. Las fallas iniciales y los límites de los runners se conservan en `progress/qa_82-88-bugfixes.md`.

Entrega mediante commits enfocados en dev; main y despliegue de producción quedan fuera de este ciclo. Los archivos previos no versionados de progress/ se conservan.
