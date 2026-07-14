# Review 68-pipeline-client-coverage

**Fecha**: 2026-07-14
**Reviewer**: Reviewer independiente (no Implementer)
**Resultado**: PASSED (22/22 criterios verificados de código; 1 criterio operativo no bloqueante pendiente por diseño)

## Método

Lectura directa del código (no de los resúmenes del Implementer), más ejecución real de `tsc --noEmit`, Jest dirigido y Jest completo. Diff acotado `80cf8a5..8896047` (fin de feature 67 → fin de feature 70, antes de que 61/62 tocaran archivos no relacionados) para confirmar que solo se tocaron los archivos documentados.

## Diagnóstico y regla de negocio

- [x] Auditoría read-only documentada en `progress/explore_68-pipeline-client-coverage.md`: Fernanda Becerril, 58 clientes activos, 49 con actividad activa del mismo seller, 19 `clientId` con deal visible. Confirma que NO es un límite de 20 (`get-pipeline-by-seller.use-case.ts` y `get-pipeline-team.use-case.ts` nunca usaron `limit`/`take`/`skip`, verificado leyendo ambos archivos completos, sin cambios en esta feature).
- [x] Causa raíz documentada antes de implementar: mismatch de definición ("iniciado" = con actividad, no con deal), no un bug de truncamiento.
- [x] Definición única de "cliente iniciado" (cliente activo con ≥1 actividad activa del mismo seller) aplicada de forma consistente en runtime (`create-activity.use-case.ts` + `activity.repository.impl.ts`) y en el backfill (`1783700000000-BackfillInitiatedClientDeals.ts`) — mismo predicado `EXISTS activities WHERE client_id=... AND seller_id=... AND deleted_at IS NULL` en ambos lugares.
- [x] La comparación de cobertura usa `clientId` distintos: confirmado en `get-pipeline-by-seller.use-case.spec.ts` (49 `clientId` distintos, 25 en una sola etapa) y `get-pipeline-team.use-case.spec.ts` (49 distintos, 30 en una etapa).

## Backend e integridad de datos

- [x] `create-activity.use-case.ts:68-102`: al registrar actividad con `clientId`, si no existe deal activo (`findByOpportunity`/`findByClientIdAndSellerId`) y el cliente existe con `client.sellerId === input.sellerId`, se marca `clientForNewDeal` y se resuelve `resolvedStage = input.stage ?? client.stage` (línea 89, y de nuevo en 126 antes de invocar `createWithPipelineSync`). Confirmado que no requiere `input.stage`.
- [x] Cliente de otro seller: línea 87 compara `client.sellerId === input.sellerId`; si no coincide, `clientForNewDeal` queda `null` y no se crea deal (test `does not create a deal under a seller different from the client owner`, línea 259).
- [x] Cliente soft-deleted: `ClientRepositoryImpl.findById` (`backend/src/modules/clients/infrastructure/repositories/client.repository.impl.ts:25-32`) usa `repo.findOne({ where: { id } })` sobre una entidad con `@DeleteDateColumn` (`client.typeorm.entity.ts:99-100`), por lo que TypeORM excluye automáticamente filas con `deleted_at` no nulo — un cliente eliminado no se resuelve y no se crea deal (test `does not create a deal when the client cannot be resolved`, línea 220).
- [x] `activity.repository.impl.ts:51-104` (`createWithPipelineSync`): toda la operación corre dentro de `this.repo.manager.transaction(...)` — una sola transacción TypeORM para actividad + deal.
- [x] Advisory lock: línea 57-60, `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))` con clave `clientId:sellerId:opportunityName|*`, parametrizado (sin riesgo de inyección), liberado automáticamente al final de la transacción (semántica `_xact_` de Postgres).
- [x] Re-chequeo bajo lock: líneas 62-76, `SELECT id FROM deals WHERE client_id=$1 AND seller_id=$2 AND deleted_at IS NULL [AND opportunity_name=$3] LIMIT 1` se ejecuta DESPUÉS de adquirir el lock y ANTES del insert condicional (línea 76 `if (existing.length === 0)`), lo que serializa correctamente primeras actividades concurrentes y evita duplicados en condición de carrera. Confirmado también por test `does not insert a duplicate deal after the transactional lock finds coverage` (línea 504).
- [x] Migración `1783700000000-BackfillInitiatedClientDeals.ts` leída completa:
  - Idempotente: el `INSERT ... SELECT` tiene `NOT EXISTS (SELECT 1 FROM deals d WHERE d.client_id=c.id AND d.seller_id=c.seller_id AND d.deleted_at IS NULL)`, por lo que una segunda corrida no encuentra filas candidatas nuevas una vez que ya existe cobertura activa. Verificado también por test estructural que corre `up()` dos veces y confirma que todas las queries mantienen el mismo predicado `NOT EXISTS`/`deleted_at IS NULL`.
  - Selecciona solo clientes no eliminados (`c.deleted_at IS NULL`) con al menos una actividad no eliminada del mismo seller (`a.deleted_at IS NULL AND a.seller_id = c.seller_id`) y sin deal activo ya existente.
  - No revive deals soft-deleted: el `NOT EXISTS` solo filtra por `deleted_at IS NULL`, así que si el único deal histórico está soft-deleted, la condición igual se cumple y se inserta un deal NUEVO (no se actualiza ni reactiva el borrado). Comportamiento correcto y documentado en `impl_68-pipeline-client-coverage.md`.
  - `down()` es no-op documentado con el comentario: "backfilled rows are indistinguishable from deals created normally and deleting them could remove legitimate pipeline data" — decisión razonable, no es un descuido: no hay forma de diferenciar después del hecho un deal creado por el backfill de uno creado orgánicamente (mismos campos, mismo `version=1`, sin flag de origen), y un `down()` real correría el riesgo de borrar deals reales creados por usuarios tras el despliegue.
  - Defaults razonables: `probability` mapea al mismo `STAGE_PROBABILITY` que usa `deal.entity.ts` (Prospecto 5, Contactado 15, Interesado 30, Propuesta 50, Negociación 70, Cierre 90, Perdido 0) — confirmado comparando ambos archivos línea por línea, coinciden exactamente. `amount` toma `c.expected_amount` del cliente. `stage_history` arranca en `'[]'::jsonb`. `opportunity_name` es `NULL` (deal genérico del cliente, no de una oportunidad nombrada).
- [x] `GET /api/pipeline/seller/:id` (`get-pipeline-by-seller.use-case.ts`): sin `limit`, `take` ni `skip`; itera `enrichedDeals` completo.
- [x] `GET /api/pipeline/team` (`get-pipeline-team.use-case.ts`): mismo patrón, sin truncamiento, agrupa por stage sin perder filas.
- [x] Scoping estricto: ambos use cases delegan el filtro de seller al repositorio (`findDetailedBySellerId`/`findDetailedAllSellers`); no hay mezcla de sellers en el código revisado, y el `create-activity` valida `sellerId` antes de crear deal.

## Frontend y regresión

- [x] No se encontró `slice`, `top-N` ni paginación incompleta en `PipelinePage.tsx`/`KanbanBoard` para el renderizado de tarjetas (búsqueda dirigida sin matches fuera de lo esperado).
- [x] Test automatizado: 49 `clientId` distintos para seller (`get-pipeline-by-seller.use-case.spec.ts`) y para team (`get-pipeline-team.use-case.spec.ts`).
- [x] Test automatizado: más de 20 en una sola etapa (25 en seller, 30 en team) se devuelven completos.
- [x] Reglas de inclusión/exclusión cubiertas por los tests de `create-activity.use-case.spec.ts` (cliente sin actividad no genera deal implícitamente porque nunca se llama `createWithPipelineSync` sin actividad real; múltiples actividades no duplican deal, verificado en `does not duplicate a deal for a later activity or retry`).

## Verificación ejecutada por este Reviewer

- `cd backend && npx tsc --noEmit` → exit 0.
- `cd frontend && npx tsc --noEmit` → exit 0.
- `cd backend && npx jest src/modules/activities/application/use-cases/create-activity.use-case.spec.ts src/modules/pipeline/application/use-cases/get-pipeline-by-seller.use-case.spec.ts src/modules/pipeline/application/use-cases/get-pipeline-team.use-case.spec.ts src/migrations/1783700000000-BackfillInitiatedClientDeals.spec.ts --runInBand` → 4 suites, 24 tests, todos PASS.
- `cd backend && npx jest --runInBand` (suite completa) → 11 suites, 60 tests, todos PASS. Sin regresión sobre la suite crítica de la feature 62.
- `git diff --stat 80cf8a5..8896047 -- backend/src frontend/src` → únicamente los 13 archivos documentados en `progress/impl_68-pipeline-client-coverage.md` (más los de 69/70, ver reviews correspondientes) fueron tocados; ningún archivo fuera de lo declarado.

## Seguimiento operativo no bloqueante (checkbox `[ ]` intencional en CHECKPOINTS.md)

- [ ] Tras desplegar y ejecutar la migración en producción, confirmar `COUNT(DISTINCT client_id)` 19 → 49 para Fernanda Becerril. Esto es correcto que quede sin marcar: depende de un despliegue real, no de código verificable ahora.

## Veredicto

**PASSED.** Los 22 criterios de código verificables están cubiertos con evidencia directa (código + tests + comandos reales). El único criterio no verificado (`[ ]` de seguimiento operativo) es correcto que permanezca pendiente porque depende de ejecución en producción tras el deploy, no de una omisión del Implementer.
