# Implementación 70 — pipeline activity updated_at

## Cambios

- Se agregó `IActivityRepository.createAndTouchDeal`, que guarda la actividad y actualiza exclusivamente `deals.updated_at` dentro de una sola transacción.
- El touch usa el ID del deal ya resuelto por `clientId`/`sellerId` y, cuando aplica, `opportunityName`; no modifica `created_at`, fase, probabilidad ni historial.
- Si el deal desaparece o está eliminado antes del touch, la operación lanza error y la transacción revierte la actividad.
- El flujo sin `clientId` conserva `create`; un cliente sin deal conserva `createWithPipelineSync`.
- `Deal` ahora expone `updatedAt?` y `DealCard` muestra solamente la fecha `dd/mm/aaaa`, sin el label `Actualizado`, usando `createdAt` como fallback.
- El badge ámbar/rojo calcula los días desde `updatedAt ?? createdAt`, por lo que registrar una actividad reinicia el contador sin modificar `stageHistory`; conserva los thresholds y estilos existentes.

## Verificación

- `backend`: `npx jest src/modules/activities/application/use-cases/create-activity.use-case.spec.ts --runInBand` — PASS, 20/20 tests.
- `backend`: `npx tsc --noEmit` — PASS.
- `frontend`: `npx tsc --noEmit` — PASS.
- Los tests añadidos cubren deal existente, ausencia de `clientId`, resolución por oportunidad, SQL limitado a `updated_at` y error transaccional cuando el touch no encuentra el deal.
