# Implementación 68 — Cobertura de clientes en pipeline

## Estado

Implementación funcional completada en los paths autorizados. La verificación local de TypeScript y Jest está en verde.

## Regla aplicada

Un cliente iniciado es un cliente activo con al menos una actividad activa vinculada, donde el seller de la actividad coincide con el seller del cliente.

Al registrar una actividad con `clientId`, el caso de uso busca primero un deal activo existente. Si no existe y el cliente activo pertenece al mismo seller, crea exactamente uno. El stage se resuelve en este orden:

1. `input.stage` de la actividad.
2. `client.stage` persistido.
Si el cliente no puede resolverse (incluido soft-deleted) o pertenece a otro seller, la actividad no crea deal. El deal conserva `clientId`, `clientName`, `sellerId`, `expectedAmount`, stage y probabilidad. Actividades posteriores que encuentran el deal no crean otro. Una actividad sin `clientId` no toca el pipeline.

La primera actividad y el aseguramiento del deal se ejecutan en una sola transacción TypeORM. Un advisory lock transaccional por `clientId + sellerId + opportunityName` serializa primeras actividades concurrentes; dentro del lock se vuelve a comprobar el deal activo antes de insertar. Si falla el deal o la actividad, TypeORM revierte toda la transacción. Sin `opportunityName`, cualquier deal activo del client/seller cubre el cliente; con nombre, la comprobación se limita a esa oportunidad para conservar múltiples oportunidades válidas.

## Archivos

- `backend/src/modules/activities/application/use-cases/create-activity.use-case.ts`: sincronización del primer deal aunque no llegue stage y resolución desde el cliente.
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts`: casos de primera actividad, stage explícito, cliente inexistente, reintento, actividad sin cliente y contrato transaccional del repositorio.
- `backend/src/modules/activities/activities.module.ts`: importación de `ClientsModule` para resolver `CLIENT_REPOSITORY`.
- `backend/src/modules/activities/domain/repositories/activity.repository.interface.ts`: operación atómica `createWithPipelineSync`.
- `backend/src/modules/activities/infrastructure/repositories/activity.repository.impl.ts`: transacción, advisory lock, comprobación activa, inserción condicional y persistencia de actividad.
- `backend/src/modules/pipeline/application/use-cases/get-pipeline-by-seller.use-case.spec.ts`: escenario de 49 clientId distintos, con 25 filas en una misma etapa.
- `backend/src/modules/pipeline/application/use-cases/get-pipeline-team.use-case.spec.ts`: 49 clientId de equipo, con 30 filas en una etapa.
- `backend/src/migrations/1783700000000-BackfillInitiatedClientDeals.ts`: backfill idempotente.
- `backend/src/migrations/1783700000000-BackfillInitiatedClientDeals.spec.ts`: validación determinista de predicados SQL e idempotencia estructural.

## Backfill

La migración inserta un deal por cliente cuando:

- El cliente no está eliminado.
- Existe al menos una actividad no eliminada con el mismo `client_id` y `seller_id` del cliente.
- No existe ningún deal activo para ese par cliente/seller.

El `NOT EXISTS` filtra `deals.deleted_at IS NULL`: si solo existe un deal soft-deleted, crea uno activo nuevo sin modificar ni revivir el borrado. Ejecutar nuevamente la migración no agrega filas para pares que ya tienen cobertura activa.

El baseline auditado en producción es 19 `clientId` visibles de 49 clientes iniciados para Fernanda. Todavía no se afirma el conteo posterior al despliegue. La aceptación posterior a ejecutar la migración debe verificarse con `COUNT(DISTINCT client_id)` y resultar en 49.

`down` es deliberadamente no-op: las filas del backfill son indistinguibles de deals creados normalmente y borrarlas podría eliminar datos legítimos generados después del despliegue.

## Verificación

- `npx tsc --noEmit` en backend: exit 0.
- `npx jest --runInBand` en backend: 6 suites, 27 tests, todos PASS.
- Pipeline seller: 49 resultados y 49 `clientId` distintos; Contactado contiene 25.
- Pipeline team: 49 resultados y 49 `clientId` distintos; Prospecto contiene 30.
- Repositorio atómico: verifica transacción única, advisory lock antes del check, no reinserción tras cobertura y propagación de fallo de actividad.
- Migración: verifica cliente/actividad activos, coincidencia de seller y `NOT EXISTS` de deals activos.

## Semántica de soft-delete

Tanto el backfill como runtime pueden crear un deal activo nuevo si el único histórico está soft-deleted. Nunca reviven ni modifican el registro borrado. Una vez existe un deal activo, la comprobación bajo lock hace idempotentes los reintentos y primeras actividades concurrentes.
