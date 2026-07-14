# Review 70-pipeline-activity-updated-at

**Fecha**: 2026-07-14
**Reviewer**: Reviewer independiente (no Implementer)
**Resultado**: PASSED (10/10 criterios de código verificados)

## Método

Lectura directa de `create-activity.use-case.ts`, `activity.repository.interface.ts`, `activity.repository.impl.ts`, `pipeline.types.ts`, `DealCard.tsx`, más búsqueda de todo otro lugar del frontend que calcule el badge de días estancados, y ejecución real de tests/typecheck.

## Backend

- [x] `activity.repository.impl.ts:106-127` (`createAndTouchDeal`): dentro de `this.repo.manager.transaction`, guarda la actividad y ejecuta `UPDATE "deals" SET "updated_at" = NOW() WHERE "id" = $1 AND "deleted_at" IS NULL RETURNING "id"` — actualiza únicamente `updated_at`, no toca `stage`, `stage_history`, `probability` ni `created_at` (no aparecen en el `SET`). Se invoca desde `create-activity.use-case.ts:139-144` cuando existe un deal previo para el cliente/seller/oportunidad (`existingDeal`).
- [x] Actividad + touch ocurren en la misma transacción TypeORM (`manager.transaction`, líneas 110-126); si el `UPDATE` no afecta filas (`touched.length === 0`, deal inexistente o `deleted_at` no nulo) se lanza `NotFoundException` (línea 123) dentro del callback transaccional, lo que hace que TypeORM revierta también el `save` de la actividad ya ejecutado en la misma transacción — no queda actividad persistida sin el touch. Confirmado también por el test `throws when the resolved deal cannot be touched so the transaction rolls back` (línea 466 de `create-activity.use-case.spec.ts`).
- [x] El touch afecta solo el deal resuelto: `create-activity.use-case.ts:69-78` resuelve `existingDeal` vía `findByOpportunity(clientId, sellerId, opportunityName)` cuando hay `opportunityName`, o `findByClientIdAndSellerId` en caso contrario, y pasa `existingDeal.id` explícito a `createAndTouchDeal` — el `UPDATE` usa `WHERE id = $1` con ese id puntual, sin afectar otros deals del mismo cliente. Confirmado por test `touches only the deal resolved by opportunity name` (línea 369).
- [x] `created_at`, `stage`, `probability`, `stage_history` no cambian: el `UPDATE` del touch solo tiene la columna `updated_at` en su `SET`; no hay ningún otro `UPDATE` a `deals` en esta ruta del código.
- [x] Actividad sin `clientId`: en `create-activity.use-case.ts`, el bloque `if (input.clientId) {...}` (línea 68) rodea toda la resolución de deal; si no hay `clientId`, `existingDeal` y `clientForNewDeal` quedan `null`, y el flujo cae en `entity ??= await this.activityRepo.create(activity)` (línea 146), que es el `create` simple sin ningún touch a `deals`. Confirmado por test `does not create a deal when the activity has no clientId` (línea 245).
- [x] Primera actividad de un cliente sin deal: usa `createWithPipelineSync` (línea 128), que inserta el deal con `created_at = NOW()` y `updated_at = NOW()` (mismo valor inicial, consistente con "válidos") dentro de la transacción — comportamiento ya cubierto y no modificado por esta feature (`activity.repository.impl.ts:77-96`).

## Frontend

- [x] `frontend/src/modules/pipeline/domain/pipeline.types.ts:98`: `Deal.updatedAt?: string` — campo opcional agregado a la interfaz, ya expuesto previamente por `DealDto` (`backend/.../dtos/deal.dto.ts`, campo `updatedAt: Date` presente desde antes de esta tanda, sin cambios en este diff).
- [x] `DealCard.tsx:40-44`: `const activityDate = deal.updatedAt ?? deal.createdAt` y `formatDate(activityDate)` en el render (línea 151) — se muestra solo la fecha, sin ningún label de texto tipo "Actualizado" antes de ella (confirmado leyendo el JSX completo del componente, líneas 129-154).
- [x] `createdAt` se usa exclusivamente como fallback cuando `updatedAt` no viene (operador `??`), tal como pide el checkpoint.

## Badge de días estancados (regresión feature 20)

- [x] `DealCard.tsx:42-48`: `daysStalled` se calcula desde `activityDate` (= `updatedAt ?? createdAt`), no desde `createdAt` puro — registrar una actividad reinicia el contador porque `updatedAt` se toca en cada actividad relacionada al deal.
- [x] Búsqueda dirigida (`grep -rn "stalled|daysStalled|createdAt" frontend/src/modules/pipeline/presentation`) no encontró ningún otro lugar (`KanbanColumn.tsx` no tiene lógica de stalled propia; no existe un hook de pipeline separado) que calcule el badge de forma independiente — `DealCard.tsx` es la única fuente de esta lógica, por lo que no hay riesgo de que otro componente siga usando solo `createdAt` y quede desincronizado.
- [x] Los thresholds (`stalledAmberDays`, `stalledRedDays` desde `useSettings()`) y los estilos (`showRed`/`showAmber`) no fueron alterados en su lógica de comparación, solo la fuente de la fecha.

## Verificación ejecutada por este Reviewer

- `cd backend && npx jest src/modules/activities/application/use-cases/create-activity.use-case.spec.ts --runInBand` → 1 suite, 20 tests, PASS.
- `cd backend && npx tsc --noEmit` → exit 0.
- `cd frontend && npx tsc --noEmit` → exit 0.
- `cd backend && npx jest --runInBand` (suite completa) → 11 suites, 60 tests, PASS, sin regresión.
- `git diff --stat 80cf8a5..8896047 -- backend/src frontend/src` → archivos tocados para esta feature: `activity.repository.interface.ts`, `activity.repository.impl.ts`, `create-activity.use-case.ts` (compartido con feature 68), `pipeline.types.ts` (compartido con 69), `DealCard.tsx`. Ninguno fuera de lo documentado en `progress/impl_70-pipeline-activity-updated-at.md`.

## Hallazgo de proceso (heredado, no bloqueante)

Al igual que la feature 69, no existe entrada en `progress/history.md` para la feature 70 (ver `progress/review_69-pipeline-free-stage.md` para el detalle). Esto no afecta la corrección del código, pero rompe la trazabilidad esperada por el flujo de `CLAUDE.md`.

## Veredicto

**PASSED** (10/10). Implementación correcta, transaccionalmente segura, sin efectos colaterales sobre `stage`/`probability`/`stageHistory`/`created_at`, y sin regresión sobre el badge de deals estancados de la feature 20.
